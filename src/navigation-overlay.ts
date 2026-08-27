import './navigation-overlay.css';
import { WORLD_MAP_HEIGHT, WORLD_MAP_WIDTH } from './world/coordinates';
import { isPolarRow, virtualWorldPoint, visibleWorldRange } from './world-wrap';

type CameraState = {
  x: number;
  y: number;
  scale: number;
  zoomMultiplier: number;
  wrapped?: boolean;
};

type MarkerState = {
  target: { x: number; y: number };
  ship: { x: number; y: number };
  headingDeg: number;
};

type TrailPoint = { x: number; y: number };
type NavigationVisibility = { heading: boolean; track: boolean; trail: boolean };

const ocean = document.querySelector<HTMLCanvasElement>('#ocean');
const shell = document.querySelector<HTMLElement>('.game-shell');

if (ocean && shell) {
  const oceanCanvas = ocean;
  const gameShell = shell;
  const overlay = document.createElement('canvas');
  overlay.id = 'navigation-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  oceanCanvas.insertAdjacentElement('afterend', overlay);

  const ctx = overlay.getContext('2d');
  let camera: CameraState | null = null;
  let markers: MarkerState | null = null;
  let navigationTarget: TrailPoint | null = null;
  let previousShip: TrailPoint | null = null;
  let trackVector: TrailPoint | null = null;
  let scheduled = false;
  let visibility: NavigationVisibility = { heading: true, track: true, trail: true };
  const trail: TrailPoint[] = [];

  const TRAIL_SAMPLE_WORLD_PX = 0.7;
  const MAX_TRAIL_POINTS = 6000;
  const VECTOR_LENGTH_SCREEN_PX = 88;

  function resize() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const width = Math.max(1, gameShell.clientWidth);
    const height = Math.max(1, gameShell.clientHeight);
    overlay.width = Math.round(width * dpr);
    overlay.height = Math.round(height * dpr);
    overlay.style.width = `${width}px`;
    overlay.style.height = `${height}px`;
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function correctedDelta(a: TrailPoint, b: TrailPoint) {
    let dx = b.x - a.x;
    if (dx > WORLD_MAP_WIDTH / 2) dx -= WORLD_MAP_WIDTH;
    if (dx < -WORLD_MAP_WIDTH / 2) dx += WORLD_MAP_WIDTH;
    return { x: dx, y: b.y - a.y };
  }

  function recordShip(point: TrailPoint) {
    if (!previousShip) {
      previousShip = point;
      trail.push(point);
      return;
    }

    const movement = correctedDelta(previousShip, point);
    const magnitude = Math.hypot(movement.x, movement.y);
    if (magnitude > 0.00001) trackVector = movement;

    const lastTrail = trail[trail.length - 1];
    const fromLastTrail = correctedDelta(lastTrail, point);
    if (Math.hypot(fromLastTrail.x, fromLastTrail.y) >= TRAIL_SAMPLE_WORLD_PX) {
      trail.push(point);
      if (trail.length > MAX_TRAIL_POINTS) trail.splice(0, trail.length - MAX_TRAIL_POINTS);
    }

    previousShip = point;
  }

  function screenPoint(point: TrailPoint, column: number, row: number) {
    if (!camera) return point;
    const virtual = virtualWorldPoint(point, column, row);
    return {
      x: camera.x + virtual.x * camera.scale,
      y: camera.y + virtual.y * camera.scale,
    };
  }

  function adjustedSegmentEnd(a: TrailPoint, b: TrailPoint): TrailPoint {
    const movement = correctedDelta(a, b);
    return { x: a.x + movement.x, y: b.y };
  }

  function drawTrail() {
    if (!visibility.trail || !ctx || !camera || trail.length < 2) return;
    const range = visibleWorldRange(camera.x, camera.y, camera.scale, gameShell.clientWidth, gameShell.clientHeight);
    ctx.save();
    ctx.strokeStyle = 'rgba(240, 189, 69, .52)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let index = 1; index < trail.length; index += 1) {
      const a = trail[index - 1];
      const b = adjustedSegmentEnd(a, trail[index]);
      for (let row = range.minRow - 1; row <= range.maxRow + 1; row += 1) {
        for (let column = range.minColumn - 1; column <= range.maxColumn + 1; column += 1) {
          const pa = screenPoint(a, column, row);
          let pb: TrailPoint;
          if (isPolarRow(row)) {
            pb = screenPoint({ x: b.x, y: b.y }, column, row);
          } else {
            pb = {
              x: camera.x + (b.x + column * WORLD_MAP_WIDTH) * camera.scale,
              y: camera.y + (row * WORLD_MAP_HEIGHT + b.y) * camera.scale,
            };
          }
          if (
            Math.max(pa.x, pb.x) < -20 || Math.min(pa.x, pb.x) > gameShell.clientWidth + 20 ||
            Math.max(pa.y, pb.y) < -20 || Math.min(pa.y, pb.y) > gameShell.clientHeight + 20
          ) continue;
          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  function drawArrow(origin: TrailPoint, direction: TrailPoint, length: number, dashPattern: number[], strokeStyle: string) {
    if (!ctx) return;
    const magnitude = Math.hypot(direction.x, direction.y);
    if (magnitude < 0.00001) return;
    const dx = direction.x / magnitude * length;
    const dy = direction.y / magnitude * length;
    const end = { x: origin.x + dx, y: origin.y + dy };
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.strokeStyle = strokeStyle;
    ctx.fillStyle = strokeStyle;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    if (dashPattern.length > 0) ctx.setLineDash(dashPattern);
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(end.x - 10 * Math.cos(angle - 0.45), end.y - 10 * Math.sin(angle - 0.45));
    ctx.lineTo(end.x - 10 * Math.cos(angle + 0.45), end.y - 10 * Math.sin(angle + 0.45));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawNavigationVectors() {
    if ((!visibility.heading && !visibility.track && !navigationTarget) || !ctx || !camera || !markers) return;
    const range = visibleWorldRange(camera.x, camera.y, camera.scale, gameShell.clientWidth, gameShell.clientHeight);
    const heading = markers.headingDeg * Math.PI / 180;
    const latDeg = 90 - markers.ship.y / WORLD_MAP_HEIGHT * 180;
    const cosLat = Math.max(0.12, Math.cos(latDeg * Math.PI / 180));
    const headingDirection = { x: Math.sin(heading) / cosLat, y: -Math.cos(heading) };
    const targetDirection = navigationTarget ? correctedDelta(markers.ship, navigationTarget) : null;

    for (let row = range.minRow - 1; row <= range.maxRow + 1; row += 1) {
      for (let column = range.minColumn - 1; column <= range.maxColumn + 1; column += 1) {
        const ship = screenPoint(markers.ship, column, row);
        if (ship.x < -110 || ship.x > gameShell.clientWidth + 110 || ship.y < -110 || ship.y > gameShell.clientHeight + 110) continue;

        let visualHeading = headingDirection;
        let visualTrack = trackVector;
        let visualTarget = targetDirection;
        if (isPolarRow(row)) {
          visualHeading = { x: -headingDirection.x, y: -headingDirection.y };
          visualTrack = trackVector ? { x: -trackVector.x, y: -trackVector.y } : null;
          visualTarget = targetDirection ? { x: -targetDirection.x, y: -targetDirection.y } : null;
        }

        if (navigationTarget && visualTarget) drawArrow(ship, visualTarget, VECTOR_LENGTH_SCREEN_PX, [2, 5], 'rgba(126, 224, 196, .95)');
        if (visibility.heading) drawArrow(ship, visualHeading, VECTOR_LENGTH_SCREEN_PX, [7, 6], 'rgba(247, 240, 223, .9)');
        if (visibility.track && visualTrack) drawArrow(ship, visualTrack, VECTOR_LENGTH_SCREEN_PX, [], '#f0bd45');
      }
    }
  }

  function render() {
    scheduled = false;
    if (!ctx) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, gameShell.clientWidth, gameShell.clientHeight);
    drawTrail();
    drawNavigationVectors();
  }

  function scheduleRender() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(render);
  }

  window.addEventListener('elcano:camera-change', (event) => {
    const detail = (event as CustomEvent<CameraState>).detail;
    if (!detail) return;
    camera = detail;
    scheduleRender();
  });

  window.addEventListener('elcano:map-markers', (event) => {
    const detail = (event as CustomEvent<MarkerState>).detail;
    if (!detail) return;
    const missionRestarted = markers && Math.hypot(
      correctedDelta(markers.ship, detail.ship).x,
      correctedDelta(markers.ship, detail.ship).y,
    ) > WORLD_MAP_WIDTH / 5;
    if (missionRestarted) {
      trail.length = 0;
      previousShip = null;
      trackVector = null;
    }
    markers = detail;
    recordShip(detail.ship);
    scheduleRender();
  });

  window.addEventListener('elcano:navigation-target', (event) => {
    const detail = (event as CustomEvent<{ target: TrailPoint | null }>).detail;
    navigationTarget = detail?.target ?? null;
    scheduleRender();
  });

  window.addEventListener('elcano:navigation-visibility', (event) => {
    const detail = (event as CustomEvent<Partial<NavigationVisibility>>).detail;
    if (!detail) return;
    visibility = { ...visibility, ...detail };
    scheduleRender();
  });

  window.addEventListener('elcano:mission-reset', () => {
    trail.length = 0;
    previousShip = null;
    trackVector = null;
    navigationTarget = null;
    scheduleRender();
  });

  const resizeObserver = new ResizeObserver(() => {
    resize();
    scheduleRender();
  });
  resizeObserver.observe(gameShell);
  resize();
}
