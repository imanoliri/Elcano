import './map-markers.css';
import { WORLD_MAP_HEIGHT, WORLD_MAP_WIDTH } from './world/coordinates';

const ocean = document.querySelector<HTMLCanvasElement>('#ocean');
const shell = document.querySelector<HTMLElement>('.game-shell');

if (ocean && shell) {
  const viewport = shell;
  const overlay = document.createElement('canvas');
  overlay.id = 'map-marker-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  ocean.insertAdjacentElement('afterend', overlay);

  const ctx = overlay.getContext('2d');
  type Camera = { x: number; y: number; scale: number; zoomMultiplier: number; wrapped?: boolean };
  type MarkerState = {
    target: { x: number; y: number };
    ship: { x: number; y: number };
    headingDeg: number;
  };

  let camera: Camera | null = null;
  let markers: MarkerState | null = null;
  let scheduled = false;

  function resize() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const width = Math.max(1, viewport.clientWidth);
    const height = Math.max(1, viewport.clientHeight);
    overlay.width = Math.round(width * dpr);
    overlay.height = Math.round(height * dpr);
    overlay.style.width = `${width}px`;
    overlay.style.height = `${height}px`;
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function markerScale() {
    if (!camera) return 1;
    return Math.max(1, Math.min(2.1, Math.sqrt(camera.zoomMultiplier / 12)));
  }

  function screenPoints(point: { x: number; y: number }) {
    if (!camera) return [point];
    const copies: { x: number; y: number }[] = [];
    for (let tileY = -1; tileY <= 1; tileY += 1) {
      for (let tileX = -1; tileX <= 1; tileX += 1) {
        copies.push({
          x: camera.x + (point.x + tileX * WORLD_MAP_WIDTH) * camera.scale,
          y: camera.y + (point.y + tileY * WORLD_MAP_HEIGHT) * camera.scale,
        });
      }
    }
    return copies;
  }

  function visible(point: { x: number; y: number }, margin = 40) {
    return point.x >= -margin && point.x <= viewport.clientWidth + margin && point.y >= -margin && point.y <= viewport.clientHeight + margin;
  }

  function drawTarget(point: { x: number; y: number }, scale: number) {
    if (!ctx) return;
    const radius = 10 * scale;
    ctx.save();
    ctx.fillStyle = '#f0bd45';
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(240,189,69,.35)';
    ctx.lineWidth = 7 * scale;
    ctx.stroke();
    ctx.restore();
  }

  function drawShip(point: { x: number; y: number }, headingDeg: number, scale: number) {
    if (!ctx) return;
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(headingDeg * Math.PI / 180);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#f7f0df';
    ctx.strokeStyle = 'rgba(8,27,38,.75)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(-8, 10);
    ctx.lineTo(0, 6);
    ctx.lineTo(8, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function render() {
    scheduled = false;
    if (!ctx) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, viewport.clientWidth, viewport.clientHeight);
    if (!camera || !markers) return;

    const scale = markerScale();
    for (const point of screenPoints(markers.target)) if (visible(point)) drawTarget(point, scale);
    for (const point of screenPoints(markers.ship)) if (visible(point)) drawShip(point, markers.headingDeg, scale);
  }

  function scheduleRender() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(render);
  }

  function sameMarkers(a: MarkerState | null, b: MarkerState) {
    return !!a &&
      a.target.x === b.target.x && a.target.y === b.target.y &&
      a.ship.x === b.ship.x && a.ship.y === b.ship.y &&
      a.headingDeg === b.headingDeg;
  }

  window.addEventListener('elcano:camera-change', (event) => {
    const detail = (event as CustomEvent<Camera>).detail;
    if (!detail) return;
    camera = detail;
    scheduleRender();
  });

  window.addEventListener('elcano:map-markers', (event) => {
    const detail = (event as CustomEvent<MarkerState>).detail;
    if (!detail || sameMarkers(markers, detail)) return;
    markers = detail;
    scheduleRender();
  });

  const resizeObserver = new ResizeObserver(() => {
    resize();
    scheduleRender();
  });
  resizeObserver.observe(viewport);
  resize();
}
