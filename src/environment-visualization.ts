import './environment-visualization.css';
import { currentAt, windAt, type Vec2 } from './simulation';
import { project, unproject } from './world/coordinates';
import { isLand } from './world/geography';

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

  function cameraFromMap(): Camera {
    const transform = mapCanvas.style.transform;
    const match = transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)\s*scale\(([-\d.]+)\)/);
    if (!match) return { x: 0, y: 0, scale: 1 };
    return { x: Number(match[1]), y: Number(match[2]), scale: Number(match[3]) };
  }

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

  function displayStep(field: Field, camera: Camera) {
    const center = project({ lat: 43.5, lon: -5 });
    const east = project({ lat: 43.5, lon: -4 });
    const pixelsPerDegree = Math.max(0.1, Math.abs(east.x - center.x) * camera.scale);
    const nativePixels = pixelsPerDegree * field.nativeStep;
    const targetSpacing = viewport.clientWidth <= 720 ? field.mobileSpacing : field.desktopSpacing;
    const multiple = Math.max(1, Math.ceil(targetSpacing / nativePixels));
    return field.nativeStep * multiple;
  }

  function arrowGeometry(x: number, y: number, vector: Vec2, field: Field) {
    const magnitude = Math.hypot(vector.x, vector.y);
    if (!Number.isFinite(magnitude) || magnitude < 0.0001) return null;
    const length = field.baseLength * Math.max(0.75, Math.min(1.35, 0.7 + Math.log2(1 + magnitude) * 0.25));
    const dx = vector.x / magnitude * length;
    const dy = -vector.y / magnitude * length;
    return { magnitude, dx, dy, sx: x - dx * 0.35, sy: y - dy * 0.35, ex: x + dx, ey: y + dy };
  }

  function screenPointIsLand(x: number, y: number, camera: Camera) {
    const world = { x: (x - camera.x) / camera.scale, y: (y - camera.y) / camera.scale };
    return isLand(unproject(world));
  }

  function arrowStaysOverWater(geometry: NonNullable<ReturnType<typeof arrowGeometry>>, camera: Camera) {
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const x = geometry.sx + (geometry.ex - geometry.sx) * t;
      const y = geometry.sy + (geometry.ey - geometry.sy) * t;
      if (screenPointIsLand(x, y, camera)) return false;
    }
    return true;
  }

  function drawArrow(x: number, y: number, vector: Vec2, field: Field, camera: Camera) {
    if (!ctx) return;
    const geometry = arrowGeometry(x, y, vector, field);
    if (!geometry || !arrowStaysOverWater(geometry, camera)) return;

    const { dx, dy, sx, sy, ex, ey } = geometry;
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

  function drawField(field: Field, time: Date, camera: Camera) {
    if (!ctx) return;
    const step = displayStep(field, camera);
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;

    ctx.strokeStyle = field.strokeStyle;
    ctx.lineWidth = field.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const startLat = Math.ceil(field.minLat / step) * step;
    const startLon = Math.ceil(field.minLon / step) * step;

    for (let lat = startLat; lat <= field.maxLat + step * 0.25; lat += step) {
      for (let lon = startLon; lon <= field.maxLon + step * 0.25; lon += step) {
        const position = { lat, lon };
        if (isLand(position)) continue;

        const world = project(position);
        const x = camera.x + world.x * camera.scale;
        const y = camera.y + world.y * camera.scale;
        if (x < -30 || x > width + 30 || y < -30 || y > height + 30) continue;
        drawArrow(x, y, field.vectorAt(position, time), field, camera);
      }
    }
  }

  let scheduled = false;
  function render() {
    scheduled = false;
    if (!ctx) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, viewport.clientWidth, viewport.clientHeight);
    const camera = cameraFromMap();
    const time = simulationTime();
    for (const field of fields) drawField(field, time, camera);
  }

  function scheduleRender() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(render);
  }

  const cameraObserver = new MutationObserver(scheduleRender);
  cameraObserver.observe(mapCanvas, { attributes: true, attributeFilter: ['style'] });

  const resizeObserver = new ResizeObserver(() => {
    resizeOverlay();
    scheduleRender();
  });
  resizeObserver.observe(viewport);

  resizeOverlay();
  scheduleRender();
  window.setInterval(scheduleRender, 1000);
}
