import './route-planner.css';
import { greatCircleDistanceNm, project, unproject, WORLD_MAP_HEIGHT, WORLD_MAP_WIDTH } from './world/coordinates';
import { isPolarRow, virtualWorldPoint, visibleWorldRange } from './world-wrap';

type Geo = { lat: number; lon: number };
type Point = { x: number; y: number };
type Camera = { x: number; y: number; scale: number };
type PlanningMode = 'direct' | 'waypoints';
type WaypointGesture = { id: number; index: number; startX: number; startY: number; dragging: boolean };

const WAYPOINT_RADIUS_NM = 1.5;
const WAYPOINT_HIT_RADIUS_PX = 18;
const ROUTE_SEGMENT_HIT_RADIUS_PX = 14;
const DRAG_THRESHOLD_PX = 7;

function initRoutePlanner() {
  const viewport = document.querySelector<HTMLElement>('.game-shell')!;
  const rudder = document.querySelector<HTMLInputElement>('#rudder')!;
  const centerRudder = document.querySelector<HTMLButtonElement>('#center-rudder');
  const topActions = document.querySelector<HTMLElement>('.top-actions')!;

  const routeActions = document.createElement('div');
  routeActions.className = 'route-actions';
  routeActions.innerHTML = `
    <button type="button" class="icon-button route-button" aria-label="Direct destination mode. Tap for waypoint mode" aria-pressed="true" title="Direct destination mode">📍</button>
  `;
  topActions.prepend(routeActions);

  const routeButton = routeActions.querySelector<HTMLButtonElement>('.route-button')!;
  const layer = document.createElement('canvas');
  layer.className = 'route-layer';
  layer.setAttribute('aria-hidden', 'true');
  viewport.append(layer);
  const routeCtx = layer.getContext('2d')!;

  let planningMode: PlanningMode = 'direct';
  let waypoints: Geo[] = [];
  let shipPosition: Geo | null = null;
  let previousShipPosition: Geo | null = null;
  let shipHeadingDeg = 0;
  let camera: Camera = { x: 0, y: 0, scale: 1 };
  let pointerStart: { id: number; x: number; y: number } | null = null;
  let waypointGesture: WaypointGesture | null = null;

  function routeIsActive() { return waypoints.length > 0; }

  function releaseHelm() {
    rudder.value = '0';
    rudder.disabled = false;
    if (centerRudder) centerRudder.disabled = false;
    rudder.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function clearRoute() {
    waypoints = [];
    releaseHelm();
    drawRoute();
  }

  function setPlanningMode(next: PlanningMode) {
    planningMode = next;
    routeButton.classList.add('active');
    routeButton.classList.toggle('direct-mode', next === 'direct');
    routeButton.classList.toggle('waypoint-mode', next === 'waypoints');
    routeButton.setAttribute('aria-pressed', 'true');
    viewport.classList.add('route-planning');
    viewport.dataset.routeMode = next;

    if (next === 'direct') {
      routeButton.textContent = '📍';
      routeButton.title = 'Direct destination mode · tap for waypoint mode';
      routeButton.setAttribute('aria-label', 'Direct destination mode. Tap for waypoint mode');
    } else {
      routeButton.textContent = '🗺️';
      routeButton.title = 'Waypoint mode · tap route to add, tap waypoint to remove, drag waypoint to move';
      routeButton.setAttribute('aria-label', 'Waypoint mode. Tap route to add, tap waypoint to remove, drag waypoint to move. Tap button for direct destination mode');
    }
    drawRoute();
  }

  routeButton.addEventListener('click', () => {
    clearRoute();
    setPlanningMode(planningMode === 'direct' ? 'waypoints' : 'direct');
  });

  function positiveModulo(value: number, modulus: number) { return ((value % modulus) + modulus) % modulus; }

  function screenToGeo(clientX: number, clientY: number): Geo {
    const rect = viewport.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    const virtualX = (screenX - camera.x) / camera.scale;
    const virtualY = (screenY - camera.y) / camera.scale;
    const row = Math.floor(virtualY / WORLD_MAP_HEIGHT);
    const localY = virtualY - row * WORLD_MAP_HEIGHT;
    const polar = isPolarRow(row);
    const canonicalY = polar ? WORLD_MAP_HEIGHT - localY : localY;
    const canonicalX = positiveModulo(virtualX - (polar ? WORLD_MAP_WIDTH / 2 : 0), WORLD_MAP_WIDTH);
    return unproject({ x: canonicalX, y: canonicalY });
  }

  function isUiTarget(target: EventTarget | null) {
    return target instanceof Element && Boolean(target.closest('button, input, .modal, .bottom-controls, .hud-top, #coastal-controls'));
  }

  function clientToViewport(clientX: number, clientY: number) {
    const rect = viewport.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function nearestWrappedScreenPoint(point: Point) {
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    const range = visibleWorldRange(camera.x, camera.y, camera.scale, width, height);
    let best = { x: 0, y: 0, distance: Infinity };
    for (let row = range.minRow - 1; row <= range.maxRow + 1; row += 1) {
      for (let column = range.minColumn - 1; column <= range.maxColumn + 1; column += 1) {
        const virtual = virtualWorldPoint(point, column, row);
        const x = camera.x + virtual.x * camera.scale;
        const y = camera.y + virtual.y * camera.scale;
        const distance = Math.hypot(x - width / 2, y - height / 2);
        if (distance < best.distance) best = { x, y, distance };
      }
    }
    return best;
  }

  function waypointAt(clientX: number, clientY: number) {
    if (planningMode !== 'waypoints') return -1;
    const pointer = clientToViewport(clientX, clientY);
    let bestIndex = -1;
    let bestDistance = WAYPOINT_HIT_RADIUS_PX;
    waypoints.forEach((waypoint, index) => {
      const point = nearestWrappedScreenPoint(project(waypoint));
      const distance = Math.hypot(pointer.x - point.x, pointer.y - point.y);
      if (distance <= bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });
    return bestIndex;
  }

  function distanceToSegment(point: Point, start: Point, end: Point) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSq = dx * dx + dy * dy;
    if (lengthSq < 0.0001) return Math.hypot(point.x - start.x, point.y - start.y);
    const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSq));
    return Math.hypot(point.x - (start.x + dx * t), point.y - (start.y + dy * t));
  }

  function routeInsertionIndex(clientX: number, clientY: number) {
    if (planningMode !== 'waypoints' || waypoints.length === 0) return -1;
    const pointer = clientToViewport(clientX, clientY);
    const routePoints: Point[] = [];
    if (shipPosition) routePoints.push(nearestWrappedScreenPoint(project(shipPosition)));
    routePoints.push(...waypoints.map((waypoint) => nearestWrappedScreenPoint(project(waypoint))));
    if (routePoints.length < 2) return -1;

    let bestIndex = -1;
    let bestDistance = ROUTE_SEGMENT_HIT_RADIUS_PX;
    for (let index = 1; index < routePoints.length; index += 1) {
      const distance = distanceToSegment(pointer, routePoints[index - 1], routePoints[index]);
      if (distance <= bestDistance) {
        bestDistance = distance;
        bestIndex = shipPosition ? index - 1 : index;
      }
    }
    return bestIndex;
  }

  window.addEventListener('pointerdown', (event) => {
    if (isUiTarget(event.target)) return;

    const waypointIndex = waypointAt(event.clientX, event.clientY);
    if (waypointIndex >= 0) {
      waypointGesture = {
        id: event.pointerId,
        index: waypointIndex,
        startX: event.clientX,
        startY: event.clientY,
        dragging: false,
      };
      pointerStart = null;
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
  }, true);

  window.addEventListener('pointermove', (event) => {
    if (!waypointGesture || waypointGesture.id !== event.pointerId) return;
    const movement = Math.hypot(event.clientX - waypointGesture.startX, event.clientY - waypointGesture.startY);
    if (movement > DRAG_THRESHOLD_PX) waypointGesture.dragging = true;
    if (waypointGesture.dragging && waypoints[waypointGesture.index]) {
      waypoints[waypointGesture.index] = screenToGeo(event.clientX, event.clientY);
      followRoute();
      drawRoute();
    }
    event.preventDefault();
    event.stopPropagation();
  }, true);

  window.addEventListener('pointerup', (event) => {
    if (waypointGesture && waypointGesture.id === event.pointerId) {
      const gesture = waypointGesture;
      waypointGesture = null;
      if (!gesture.dragging) {
        waypoints.splice(gesture.index, 1);
        if (waypoints.length === 0) releaseHelm();
        else followRoute();
        drawRoute();
      } else if (waypoints[gesture.index]) {
        waypoints[gesture.index] = screenToGeo(event.clientX, event.clientY);
        followRoute();
        drawRoute();
      }
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (!pointerStart || pointerStart.id !== event.pointerId || isUiTarget(event.target)) {
      pointerStart = null;
      return;
    }
    const movement = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
    pointerStart = null;
    if (movement > DRAG_THRESHOLD_PX) return;

    const destination = screenToGeo(event.clientX, event.clientY);
    if (planningMode === 'direct') {
      waypoints = [destination];
    } else {
      const insertionIndex = routeInsertionIndex(event.clientX, event.clientY);
      if (insertionIndex >= 0) waypoints.splice(insertionIndex, 0, destination);
      else waypoints.push(destination);
    }

    followRoute();
    drawRoute();
  }, true);

  window.addEventListener('pointercancel', (event) => {
    if (waypointGesture?.id === event.pointerId) waypointGesture = null;
    if (pointerStart?.id === event.pointerId) pointerStart = null;
  }, true);

  window.addEventListener('elcano:camera-change', (event) => {
    const detail = (event as CustomEvent<Camera>).detail;
    if (!detail) return;
    camera = { x: detail.x, y: detail.y, scale: detail.scale };
    drawRoute();
  });

  window.addEventListener('elcano:map-markers', (event) => {
    const detail = (event as CustomEvent<{ ship: Point; headingDeg: number }>).detail;
    if (!detail) return;
    const nextShipPosition = unproject(detail.ship);
    previousShipPosition = shipPosition;
    shipPosition = nextShipPosition;
    shipHeadingDeg = detail.headingDeg;
    followRoute();
    drawRoute();
  });

  function bearingTo(from: Geo, to: Geo) {
    const deg = Math.PI / 180;
    const lat1 = from.lat * deg;
    const lat2 = to.lat * deg;
    const dLon = (to.lon - from.lon) * deg;
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    return (Math.atan2(y, x) / deg + 360) % 360;
  }

  function signedAngleDifference(target: number, reference: number) { return ((target - reference + 540) % 360) - 180; }

  function waypointWasReached(previous: Geo | null, current: Geo, waypoint: Geo) {
    if (greatCircleDistanceNm(current, waypoint) <= WAYPOINT_RADIUS_NM) return true;
    if (!previous) return false;

    const midLatRad = ((previous.lat + current.lat + waypoint.lat) / 3) * Math.PI / 180;
    const cosLat = Math.max(0.05, Math.cos(midLatRad));
    const toLocal = (position: Geo) => ({
      x: (position.lon - previous.lon) * 60 * cosLat,
      y: (position.lat - previous.lat) * 60,
    });
    const end = toLocal(current);
    const point = toLocal(waypoint);
    const segmentLengthSq = end.x * end.x + end.y * end.y;
    if (segmentLengthSq < 0.000001) return false;
    const t = Math.max(0, Math.min(1, (point.x * end.x + point.y * end.y) / segmentLengthSq));
    const closestX = end.x * t;
    const closestY = end.y * t;
    return Math.hypot(point.x - closestX, point.y - closestY) <= WAYPOINT_RADIUS_NM;
  }

  function followRoute() {
    const ship = shipPosition;
    if (!ship || !routeIsActive()) {
      rudder.disabled = false;
      if (centerRudder) centerRudder.disabled = false;
      return;
    }

    while (waypoints.length > 0 && waypointWasReached(previousShipPosition, ship, waypoints[0])) {
      waypoints.shift();
    }

    if (!routeIsActive()) {
      releaseHelm();
      return;
    }

    const desired = bearingTo(ship, waypoints[0]);
    const error = signedAngleDifference(desired, shipHeadingDeg);
    rudder.value = String(Math.round(Math.max(-20, Math.min(20, error * 0.65))));
    rudder.disabled = true;
    if (centerRudder) centerRudder.disabled = true;
    rudder.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function resizeLayer() {
    const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    layer.width = Math.max(1, Math.round(width * dpr));
    layer.height = Math.max(1, Math.round(height * dpr));
    layer.style.width = `${width}px`;
    layer.style.height = `${height}px`;
    routeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { width, height };
  }

  function formatDistance(distanceNm: number) {
    return distanceNm < 10 ? distanceNm.toFixed(1) : String(Math.round(distanceNm));
  }

  function drawLegLabel(fromGeo: Geo, toGeo: Geo, fromPoint: Point, toPoint: Point, width: number, height: number) {
    const x = (fromPoint.x + toPoint.x) / 2;
    const y = (fromPoint.y + toPoint.y) / 2;
    if (x < -80 || x > width + 80 || y < -30 || y > height + 30) return;

    const distanceNm = greatCircleDistanceNm(fromGeo, toGeo);
    const bearing = Math.round(bearingTo(fromGeo, toGeo)) % 360;
    const text = `${formatDistance(distanceNm)} nm · ${String(bearing).padStart(3, '0')}°`;
    routeCtx.font = '600 11px system-ui, sans-serif';
    routeCtx.textAlign = 'center';
    routeCtx.textBaseline = 'middle';
    const metrics = routeCtx.measureText(text);
    const boxWidth = metrics.width + 10;
    const boxHeight = 20;
    routeCtx.fillStyle = 'rgba(5,18,27,.82)';
    routeCtx.fillRect(x - boxWidth / 2, y - boxHeight / 2, boxWidth, boxHeight);
    routeCtx.fillStyle = 'rgba(255,255,255,.92)';
    routeCtx.fillText(text, x, y);
  }

  function drawRoute() {
    const { width, height } = resizeLayer();
    routeCtx.clearRect(0, 0, width, height);
    if (waypoints.length === 0) return;
    const points = waypoints.map((waypoint) => nearestWrappedScreenPoint(project(waypoint)));
    const shipPoint = shipPosition ? nearestWrappedScreenPoint(project(shipPosition)) : null;
    routeCtx.save();
    routeCtx.lineWidth = 2;
    routeCtx.strokeStyle = planningMode === 'direct' ? 'rgba(240,189,69,.9)' : 'rgba(255,255,255,.78)';
    routeCtx.setLineDash(planningMode === 'direct' ? [4, 4] : [7, 5]);
    routeCtx.beginPath();
    if (shipPoint) routeCtx.moveTo(shipPoint.x, shipPoint.y);
    else routeCtx.moveTo(points[0].x, points[0].y);
    for (const point of points) routeCtx.lineTo(point.x, point.y);
    routeCtx.stroke();
    routeCtx.setLineDash([]);

    if (planningMode === 'waypoints') {
      if (shipPoint && shipPosition) drawLegLabel(shipPosition, waypoints[0], shipPoint, points[0], width, height);
      for (let index = 1; index < waypoints.length; index += 1) {
        drawLegLabel(waypoints[index - 1], waypoints[index], points[index - 1], points[index], width, height);
      }
    }

    points.forEach((point, index) => {
      routeCtx.beginPath();
      routeCtx.arc(point.x, point.y, planningMode === 'waypoints' ? 8 : 7, 0, Math.PI * 2);
      routeCtx.fillStyle = planningMode === 'direct' ? 'rgba(240,189,69,.95)' : 'rgba(5,18,27,.94)';
      routeCtx.fill();
      routeCtx.lineWidth = planningMode === 'waypoints' ? 2 : 1;
      routeCtx.strokeStyle = planningMode === 'waypoints' ? 'rgba(240,189,69,.95)' : 'rgba(255,255,255,.9)';
      routeCtx.stroke();
      if (planningMode === 'waypoints') {
        routeCtx.fillStyle = 'rgba(255,255,255,.95)';
        routeCtx.font = '600 10px system-ui, sans-serif';
        routeCtx.textAlign = 'center';
        routeCtx.textBaseline = 'middle';
        routeCtx.fillText(String(index + 1), point.x, point.y);
      }
    });
    routeCtx.restore();
  }

  new ResizeObserver(drawRoute).observe(viewport);
  setPlanningMode('direct');
  drawRoute();
}

initRoutePlanner();
