import './map-navigation.css';
import { greatCircleDistanceNm, project, unproject, WORLD_MAP_HEIGHT, WORLD_MAP_WIDTH } from './world/coordinates';
import { virtualWorldPoint, visibleWorldRange } from './world-wrap';

type Camera = { x: number; y: number; scale: number; zoomMultiplier: number };
type Label = { name: string; lat: number; lon: number; minZoom: number; kind: 'port' | 'island' | 'sea' | 'region' };
type Point = { x: number; y: number };

const LABELS: Label[] = [
  { name: 'Atlantic Ocean', lat: 23, lon: -36, minZoom: 0, kind: 'sea' },
  { name: 'Pacific Ocean', lat: 5, lon: -145, minZoom: 0, kind: 'sea' },
  { name: 'Indian Ocean', lat: -18, lon: 78, minZoom: 0, kind: 'sea' },
  { name: 'Mediterranean Sea', lat: 36, lon: 16, minZoom: 1.2, kind: 'sea' },
  { name: 'Caribbean Sea', lat: 15, lon: -74, minZoom: 1.4, kind: 'sea' },
  { name: 'North Sea', lat: 56, lon: 3, minZoom: 2, kind: 'sea' },
  { name: 'Bay of Biscay', lat: 45.3, lon: -4.5, minZoom: 3.5, kind: 'sea' },
  { name: 'Strait of Magellan', lat: -53.3, lon: -72.5, minZoom: 5, kind: 'region' },
  { name: 'Canary Islands', lat: 28.3, lon: -15.7, minZoom: 2.5, kind: 'island' },
  { name: 'Azores', lat: 38.5, lon: -28, minZoom: 3, kind: 'island' },
  { name: 'Cape Verde', lat: 16, lon: -24, minZoom: 3, kind: 'island' },
  { name: 'Guam', lat: 13.45, lon: 144.8, minZoom: 4.5, kind: 'island' },
  { name: 'Tidore', lat: 0.68, lon: 127.4, minZoom: 6, kind: 'island' },
  { name: 'San Sebastián', lat: 43.3183, lon: -1.9812, minZoom: 6, kind: 'port' },
  { name: 'A Coruña', lat: 43.3623, lon: -8.4115, minZoom: 6, kind: 'port' },
  { name: 'Lisbon', lat: 38.7223, lon: -9.1393, minZoom: 6, kind: 'port' },
  { name: 'Seville', lat: 37.3891, lon: -5.9845, minZoom: 7, kind: 'port' },
  { name: 'Las Palmas', lat: 28.1235, lon: -15.4363, minZoom: 7, kind: 'port' },
  { name: 'Rio de Janeiro', lat: -22.9068, lon: -43.1729, minZoom: 6, kind: 'port' },
  { name: 'Cebu', lat: 10.3157, lon: 123.8854, minZoom: 7, kind: 'port' },
];

const ocean = document.querySelector<HTMLCanvasElement>('#ocean');
const shell = document.querySelector<HTMLElement>('.game-shell');

if (ocean && shell) {
  const viewport = shell;
  const overlay = document.createElement('canvas');
  overlay.id = 'map-navigation-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  ocean.insertAdjacentElement('afterend', overlay);
  const ctx = overlay.getContext('2d');

  const scale = document.createElement('div');
  scale.className = 'nautical-scale';
  scale.innerHTML = '<div class="nautical-scale-line"></div><span class="nautical-scale-label">— nm</span>';
  viewport.append(scale);
  const scaleLine = scale.querySelector<HTMLElement>('.nautical-scale-line')!;
  const scaleLabel = scale.querySelector<HTMLElement>('.nautical-scale-label')!;

  const north = document.createElement('div');
  north.className = 'map-north-cue';
  north.setAttribute('aria-hidden', 'true');
  north.innerHTML = '<span>N</span>';
  viewport.append(north);

  let camera: Camera | null = null;
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

  function screenCopies(point: Point) {
    if (!camera) return [];
    const range = visibleWorldRange(camera.x, camera.y, camera.scale, viewport.clientWidth, viewport.clientHeight);
    const points: Point[] = [];
    for (let row = range.minRow - 1; row <= range.maxRow + 1; row += 1) {
      for (let column = range.minColumn - 1; column <= range.maxColumn + 1; column += 1) {
        const virtual = virtualWorldPoint(point, column, row);
        points.push({ x: camera.x + virtual.x * camera.scale, y: camera.y + virtual.y * camera.scale });
      }
    }
    return points;
  }

  function labelStyle(label: Label) {
    if (label.kind === 'sea') return { font: 'italic 600 13px Georgia, serif', fill: 'rgba(190,218,230,.68)' };
    if (label.kind === 'region') return { font: '700 11px system-ui, sans-serif', fill: 'rgba(223,210,172,.8)' };
    if (label.kind === 'island') return { font: '600 11px system-ui, sans-serif', fill: 'rgba(235,225,199,.82)' };
    return { font: '700 10px system-ui, sans-serif', fill: 'rgba(247,240,223,.94)' };
  }

  function drawLabels() {
    if (!ctx || !camera) return;
    const occupied: { x: number; y: number; w: number; h: number }[] = [];
    const visible = LABELS.filter((label) => camera!.zoomMultiplier >= label.minZoom)
      .sort((a, b) => b.minZoom - a.minZoom);

    for (const label of visible) {
      const style = labelStyle(label);
      ctx.font = style.font;
      const width = ctx.measureText(label.name).width;
      for (const point of screenCopies(project(label))) {
        if (point.x < -width || point.x > viewport.clientWidth + width || point.y < -20 || point.y > viewport.clientHeight + 20) continue;
        const box = { x: point.x - width / 2 - 4, y: point.y - 8, w: width + 8, h: 16 };
        if (occupied.some((other) => box.x < other.x + other.w && box.x + box.w > other.x && box.y < other.y + other.h && box.y + box.h > other.y)) continue;
        occupied.push(box);
        ctx.save();
        ctx.font = style.font;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(3,14,21,.78)';
        ctx.strokeText(label.name, point.x, point.y);
        ctx.fillStyle = style.fill;
        ctx.fillText(label.name, point.x, point.y);
        if (label.kind === 'port') {
          ctx.fillStyle = '#e8b94f';
          ctx.beginPath();
          ctx.arc(point.x, point.y - 8, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        break;
      }
    }
  }

  function niceDistance(value: number) {
    const powers = [1, 2, 5];
    const exponent = Math.floor(Math.log10(Math.max(0.001, value)));
    const base = 10 ** exponent;
    let best = base;
    for (const p of powers) if (p * base <= value) best = p * base;
    return best;
  }

  function updateScale() {
    if (!camera) return;
    const targetPx = Math.min(110, Math.max(70, viewport.clientWidth * 0.12));
    const centerX = viewport.clientWidth / 2;
    const centerY = viewport.clientHeight / 2;
    const worldA = { x: (centerX - camera.x) / camera.scale, y: (centerY - camera.y) / camera.scale };
    const worldB = { x: (centerX + targetPx - camera.x) / camera.scale, y: (centerY - camera.y) / camera.scale };
    const geoA = unproject({ x: ((worldA.x % WORLD_MAP_WIDTH) + WORLD_MAP_WIDTH) % WORLD_MAP_WIDTH, y: Math.max(0, Math.min(WORLD_MAP_HEIGHT, worldA.y)) });
    const geoB = unproject({ x: ((worldB.x % WORLD_MAP_WIDTH) + WORLD_MAP_WIDTH) % WORLD_MAP_WIDTH, y: Math.max(0, Math.min(WORLD_MAP_HEIGHT, worldB.y)) });
    const distance = greatCircleDistanceNm(geoA, geoB);
    const niceNm = niceDistance(distance);
    const width = Math.max(28, targetPx * niceNm / Math.max(distance, 0.001));
    scaleLine.style.width = `${width}px`;
    scaleLabel.textContent = `${niceNm < 10 ? niceNm.toFixed(niceNm < 1 ? 1 : 0) : Math.round(niceNm)} nm`;
  }

  function render() {
    scheduled = false;
    if (!ctx || !camera) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, viewport.clientWidth, viewport.clientHeight);
    drawLabels();
    updateScale();
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

  const resizeObserver = new ResizeObserver(() => { resize(); scheduleRender(); });
  resizeObserver.observe(viewport);
  resize();
}
