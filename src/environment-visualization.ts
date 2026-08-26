import './environment-visualization.css';
import { currentAt, windAt, type Vec2 } from './simulation';
import { project, unproject } from './world/coordinates';
import { drawLandMask } from './world/geography';

const ocean = document.querySelector<HTMLCanvasElement>('#ocean');
const shell = document.querySelector<HTMLElement>('.game-shell');

if (ocean && shell) {
  const mapCanvas = ocean;
  const viewport = shell;
  const overlay = document.createElement('canvas');
  overlay.id = 'environment-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  mapCanvas.insertAdjacentElement('afterend', overlay);

  const ctx = overlay.getContext('2d');
  const badge = document.createElement('div');
  badge.className = 'environment-resolution-badge';
  badge.textContent = 'Data: Wind 0.25° · Current 0.08° · Ocean only';
  viewport.append(badge);

  type Field = {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
    nativeStep: number;
    desktopSpacing: number;
    mobileSpacing: number;
    vectorAt: (position: { lat: number; lon: number }, time: Date) => Vec2;
    strokeStyle: string;
    baseLength: number;
    width: number;
  };

  const fields: Field[] = [
    {
      minLat: 41.125,
      maxLat: 46.375,
      minLon: -11.375,
      maxLon: 0.875,
      nativeStep: 0.25,
      desktopSpacing: 28,
      mobileSpacing: 42,
      vectorAt: windAt,
      strokeStyle: 'rgba(255,255,255,.82)',
      baseLength: 18,
      width: 1.35,
    },
    {
      minLat: 41.04,
      maxLat: 46.48,
      minLon: -11.44,
      maxLon: 0.96,
      nativeStep: 0.08,
      desktopSpacing: 24,
      mobileSpacing: 34,
      vectorAt: currentAt,
      strokeStyle: 'rgba(74,213,255,.88)',
      baseLength: 15,
      width: 1.5,
    },
  ];

  type Camera = { x: number; y: number; scale: number };
  type GeoBounds = { minLat: number; maxLat: number; minLon: number; maxLon: number };
  let camera: Camera | null = null;

  function resizeOverlay() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const width = Math.max(1, viewport.clientWidth);
    const height = Math.max(1, viewport.clientHeight);
    overlay.width = Math.round(width * dpr);
    overlay.height = Math.round(height * dpr);
    overlay.style.width = `${width}px`;
    overlay.style.height = `${height}px`;
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function simulationTime() {
    const elapsedText = document.querySelector<HTMLElement>('#elapsed')?.textContent ?? '0';
    const elapsedHours = Number.parseFloat(elapsedText) || 0;
    return new Date(Date.UTC(1525, 6, 1, 12) + elapsedHours * 3_600_000);
  }

  function displayStep(field: Field, value: Camera) {
    const center = project({ lat: 43.5, lon: -5 });
    const east = project({ lat: 43.5, lon: -4 });
    const pixelsPerDegree = Math.max(0.1, Math.abs(east.x - center.x) * value.scale);
    const nativePixels = pixelsPerDegree * field.nativeStep;
    const targetSpacing = viewport.clientWidth <= 720 ? field.mobileSpacing : field.desktopSpacing;
    const multiple = Math.max(1, Math.ceil(targetSpacing / nativePixels));
    return field.nativeStep * multiple;
  }

  function visibleGeoBounds(value: Camera): GeoBounds {
    const pad = 32;
    const left = (-pad - value.x) / value.scale;
    const right = (viewport.clientWidth + pad - value.x) / value.scale;
    const top = (-pad - value.y) / value.scale;
    const bottom = (viewport.clientHeight + pad - value.y) / value.scale;
    const a = unproject({ x: left, y: top });
    const b = unproject({ x: right, y: bottom });
    return {
      minLat: Math.min(a.lat, b.lat),
      maxLat: Math.max(a.lat, b.lat),
      minLon: Math.min(a.lon, b.lon),
      maxLon: Math.max(a.lon, b.lon),
    };
  }

  function drawArrow(x: number, y: number, vector: Vec2, field: Field) {
    if (!ctx) return;
    const magnitude = Math.hypot(vector.x, vector.y);
    if (!Number.isFinite(magnitude) || magnitude < 0.0001) return;
    const length = field.baseLength * Math.max(0.75, Math.min(1.35, 0.7 + Math.log2(1 + magnitude) * 0.25));
    const dx = vector.x / magnitude * length;
    const dy = -vector.y / magnitude * length;
    const sx = x - dx * 0.35;
    const sy = y - dy * 0.35;
    const ex = x + dx;
    const ey = y + dy;
    const angle = Math.atan2(dy, dx);
    const head = 4.5;

    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - head * Math.cos(angle - 0.55), ey - head * Math.sin(angle - 0.55));
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - head * Math.cos(angle + 0.55), ey - head * Math.sin(angle + 0.55));
    ctx.stroke();
  }

  function drawField(field: Field, time: Date, value: Camera, visible: GeoBounds) {
    if (!ctx) return;
    const minLat = Math.max(field.minLat, visible.minLat);
    const maxLat = Math.min(field.maxLat, visible.maxLat);
    const minLon = Math.max(field.minLon, visible.minLon);
    const maxLon = Math.min(field.maxLon, visible.maxLon);
    if (minLat > maxLat || minLon > maxLon) return;

    const step = displayStep(field, value);
    ctx.strokeStyle = field.strokeStyle;
    ctx.lineWidth = field.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const startLat = Math.ceil(minLat / step) * step;
    const startLon = Math.ceil(minLon / step) * step;

    for (let lat = startLat; lat <= maxLat + step * 0.25; lat += step) {
      for (let lon = startLon; lon <= maxLon + step * 0.25; lon += step) {
        const position = { lat, lon };
        const world = project(position);
        const x = value.x + world.x * value.scale;
        const y = value.y + world.y * value.scale;
        drawArrow(x, y, field.vectorAt(position, time), field);
      }
    }
  }

  function eraseLand(value: Camera) {
    if (!ctx) return;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.translate(value.x, value.y);
    ctx.scale(value.scale, value.scale);
    drawLandMask(ctx);
    ctx.restore();
  }

  let scheduled = false;
  function render() {
    scheduled = false;
    if (!ctx || !camera) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, viewport.clientWidth, viewport.clientHeight);
    const time = simulationTime();
    const visible = visibleGeoBounds(camera);
    for (const field of fields) drawField(field, time, camera, visible);
    eraseLand(camera);
  }

  function scheduleRender() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(render);
  }

  window.addEventListener('elcano:camera-change', (event) => {
    const detail = (event as CustomEvent<Camera>).detail;
    if (!detail) return;
    camera = detail;
    scheduleRender();
  });

  const resizeObserver = new ResizeObserver(() => {
    resizeOverlay();
    scheduleRender();
  });
  resizeObserver.observe(viewport);

  resizeOverlay();
  window.setInterval(scheduleRender, 1000);
}
