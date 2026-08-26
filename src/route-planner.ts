import './route-planner.css';
import { greatCircleDistanceNm, project, unproject, WORLD_MAP_HEIGHT, WORLD_MAP_WIDTH } from './world/coordinates';
import { isPolarRow, virtualWorldPoint, visibleWorldRange } from './world-wrap';

type Geo = { lat: number; lon: number };
type Point = { x: number; y: number };
type Camera = { x: number; y: number; scale: number };

function initRoutePlanner() {
  const viewport = document.querySelector<HTMLElement>('.game-shell');
  const canvas = document.querySelector<HTMLCanvasElement>('#ocean');
  const rudder = document.querySelector<HTMLInputElement>('#rudder');
  const centerRudder = document.querySelector<HTMLButtonElement>('#center-rudder');
  const topActions = document.querySelector<HTMLElement>('.top-actions');
  if (!viewport || !canvas || !rudder || !topActions) return;

  const routeActions = document.createElement('div');
  routeActions.className = 'route-actions';
  routeActions.innerHTML = `
    <button type="button" class="icon-button route-button" aria-label="Plan route" aria-pressed="false" title="Plan route">🗺️</button>
    <button type="button" class="icon-button route-clear" aria-label="Clear route" title="Clear route" hidden>❌</button>
  `;
  topActions.prepend(routeActions);

  const routeButton = routeActions.querySelector<HTMLButtonElement>('.route-button');
  const clearButton = routeActions.querySelector<HTMLButtonElement>('.route-clear');
  if (!routeButton || !clearButton) return;

  const layer = document.createElement('canvas');
  layer.className = 'route-layer';
  layer.setAttribute('aria-hidden', 'true');
  viewport.append(layer);
  const routeCtx = layer.getContext('2d');
  if (!routeCtx) return;

  let planning = false;
  let waypoints: Geo[] = [];
  let activeIndex = 0;
  let shipPosition: Geo | null = null;
  let shipHeadingDeg = 0;
  let camera: Camera = { x: 0, y: 0, scale: 1 };
  let pointerStart: { id: number; x: number; y: number } | null = null;

  function routeIsActive() {
    return activeIndex < waypoints.length;
  }

  function setPlanning(next: boolean) {
    planning = next;
    routeButton.classList.toggle('active', planning);
    routeButton.setAttribute('aria-pressed', String(planning));
    routeButton.title = planning ? 'Stop adding waypoints' : 'Plan route';
    viewport.classList.toggle('route-planning', planning);
  }

  function updateButtons() {
    clearButton.hidden = waypoints.length === 0;
  }

  routeButton.addEventListener('click', () => {
    if (!planning && waypoints.length === 0) {
      document.querySelector<HTMLButtonElement>('.time-button[data-time="0"]')?.click();
    }
    setPlanning(!planning);
  });

  clearButton.addEventListener('click', () => {
    waypoints = [];
    activeIndex = 0;
    setPlanning(false);
    rudder.value = '0';
    rudder.disabled = false;
    if (centerRudder) centerRudder.disabled = false;
    updateButtons();
    drawRoute();
  });

  function positiveModulo(value: number, modulus: number) {
    return ((value % modulus) + modulus) % modulus;
  }

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

  window.addEventListener('pointerdown', (event) => {
    if (!planning || isUiTarget(event.target)) return;
    pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
  }, true);

  window.addEventListener('pointerup', (event) => {
    if (!planning || !pointerStart || pointerStart.id !== event.pointerId || isUiTarget(event.target)) {
      pointerStart = null;
      return;
    }
    const movement = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
    pointerStart = null;
    if (movement > 7) return;
    waypoints.push(screenToGeo(event.clientX, event.clientY));
    updateButtons();
    drawRoute();
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
    shipPosition = unproject(detail.ship);
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

  function signedAngleDifference(target: number, reference: number) {
    return ((target - reference + 540) % 360) - 180;
  }

  function followRoute() {
    const ship = shipPosition;
    if (!ship || !routeIsActive()) {
      if (!routeIsActive()) {
        rudder.disabled = false;
        if (centerRudder) centerRudder.disabled = false;
      }
      return;
    }

    while (activeIndex < waypoints.length && greatCircleDistanceNm(ship, waypoints[activeIndex]) <= 1.5) {
      activeIndex += 1;
    }

    if (!routeIsActive()) {
      rudder.value = '0';
      rudder.disabled = false;
      if (centerRudder) centerRudder.disabled = false;
      return;
    }

    const desired = bearingTo(ship, waypoints[activeIndex]);
    const error = signedAngleDifference(desired, shipHeadingDeg);
    rudder.value = String(Math.round(Math.max(-20, Math.min(20, error * 0.65))));
    rudder.disabled = true;
    if (centerRudder) centerRudder.disabled = true;
    rudder.dispatchEvent(new Event('input', { bubbles: true }));
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

  function drawRoute() {
    const { width, height } = resizeLayer();
    routeCtx.clearRect(0, 0, width, height);
    if (waypoints.length === 0) return;

    const points = waypoints.map((waypoint) => nearestWrappedScreenPoint(project(waypoint)));
    const shipPoint = shipPosition ? nearestWrappedScreenPoint(project(shipPosition)) : null;

    routeCtx.save();
    routeCtx.lineWidth = 2;
    routeCtx.strokeStyle = 'rgba(244,239,230,.8)';
    routeCtx.setLineDash([7, 5]);
    routeCtx.beginPath();
    if (shipPoint && routeIsActive()) routeCtx.moveTo(shipPoint.x, shipPoint.y);
    else routeCtx.moveTo(points[0].x, points[0].y);
    for (let index = activeIndex; index < points.length; index += 1) routeCtx.lineTo(points[index].x, points[index].y);
    routeCtx.stroke();
    routeCtx.setLineDash([]);

    points.forEach((point, index) => {
      routeCtx.beginPath();
      routeCtx.arc(point.x, point.y, 7, 0, Math.PI * 2);
      routeCtx.fillStyle = index < activeIndex ? 'rgba(244,239,230,.28)' : 'rgba(5,18,27,.92)';
      routeCtx.fill();
      routeCtx.strokeStyle = 'rgba(244,239,230,.9)';
      routeCtx.stroke();
      routeCtx.fillStyle = 'rgba(244,239,230,.95)';
      routeCtx.font = '600 10px system-ui, sans-serif';
      routeCtx.textAlign = 'center';
      routeCtx.textBaseline = 'middle';
      routeCtx.fillText(String(index + 1), point.x, point.y);
    });
    routeCtx.restore();
  }

  new ResizeObserver(drawRoute).observe(viewport);
  updateButtons();
  drawRoute();
}

initRoutePlanner();
