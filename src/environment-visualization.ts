import './environment-visualization.css';
import { currentAt, windAt, type Vec2 } from './simulation';
import { project } from './world/coordinates';

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
  badge.textContent = 'Data: Wind 0.25° · Current 0.08° · Display: adaptive';
  viewport.append(badge);

  type Field = {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
    nativeStep: number;
    minScreenSpacing: number;
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
      minScreenSpacing: 28,
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
      minScreenSpacing: 24,
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
    const multiple = Math.max(1, Math.ceil(field.minScreenSpacing / nativePixels));
    return field.nativeStep * multiple;
  }

  function drawArrow(x: number, y: number, vector: Vec2, field: Field) {
    if (!ctx) return;
    const magnitude = Math.hypot(vector.x, vector.y);
    if (!Number.isFinite(magnitude) || magnitude < 0.0001) return;

    const length = field.baseLength * Math.max(0.75, Math.min(1.35, 0.7 + Math.log2(1 + magnitude) * 0.25));
    const dx = vector.x / magnitude * length;
    const dy = -vector.y / magnitude * length;
    const ex = x + dx;
    const ey = y + dy;
    const angle = Math.atan2(dy, dx);
    const head = 4.5;

    ctx.beginPath();
    ctx.moveTo(x - dx * 0.35, y - dy * 0.35);
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
        const world = project({ lat, lon });
        const x = camera.x + world.x * camera.scale;
        const y = camera.y + world.y * camera.scale;
        if (x < -30 || x > width + 30 || y < -30 || y > height + 30) continue;
        drawArrow(x, y, field.vectorAt({ lat, lon }, time), field);
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
