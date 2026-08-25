import './environment-visualization.css';
import { currentAt, windAt, type Vec2 } from './simulation';
import { project } from './world/coordinates';

const ocean = document.querySelector<HTMLCanvasElement>('#ocean');
const shell = document.querySelector<HTMLElement>('.game-shell');

if (ocean && shell) {
  const overlay = document.createElement('canvas');
  overlay.id = 'environment-overlay';
  overlay.width = ocean.width;
  overlay.height = ocean.height;
  overlay.setAttribute('aria-hidden', 'true');
  ocean.insertAdjacentElement('afterend', overlay);

  const ctx = overlay.getContext('2d');
  const badge = document.createElement('div');
  badge.className = 'environment-resolution-badge';
  badge.textContent = 'Wind 0.25° · Current 0.08°';
  shell.append(badge);

  type Field = {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
    step: number;
    vectorAt: (position: { lat: number; lon: number }, time: Date) => Vec2;
    strokeStyle: string;
    lineWidth: number;
    length: number;
  };

  const fields: Field[] = [
    { minLat: 41.125, maxLat: 46.375, minLon: -11.375, maxLon: 0.875, step: 0.25, vectorAt: windAt, strokeStyle: 'rgba(255,255,255,.62)', lineWidth: .45, length: 1.6 },
    { minLat: 41.04, maxLat: 46.48, minLon: -11.44, maxLon: 0.96, step: 0.08, vectorAt: currentAt, strokeStyle: 'rgba(74,213,255,.68)', lineWidth: .28, length: .72 },
  ];

  function drawField(field: Field, time: Date) {
    if (!ctx) return;
    ctx.save();
    ctx.strokeStyle = field.strokeStyle;
    ctx.lineWidth = field.lineWidth;
    ctx.beginPath();
    for (let lat = field.minLat; lat <= field.maxLat + field.step / 2; lat += field.step) {
      for (let lon = field.minLon; lon <= field.maxLon + field.step / 2; lon += field.step) {
        const position = { lat, lon };
        const vector = field.vectorAt(position, time);
        const magnitude = Math.hypot(vector.x, vector.y);
        if (!Number.isFinite(magnitude) || magnitude < .0001) continue;
        const p = project(position);
        const dx = vector.x / magnitude * field.length;
        const dy = -vector.y / magnitude * field.length;
        ctx.moveTo(p.x - dx * .5, p.y - dy * .5);
        ctx.lineTo(p.x + dx * .5, p.y + dy * .5);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  function simulationTime() {
    const elapsedText = document.querySelector<HTMLElement>('#elapsed')?.textContent ?? '0';
    const elapsedHours = Number.parseFloat(elapsedText) || 0;
    return new Date(Date.UTC(1525, 6, 1, 12) + elapsedHours * 3_600_000);
  }

  let renderedMonth = -1;
  function refresh() {
    if (!ctx) return;
    const time = simulationTime();
    const month = time.getUTCMonth();
    if (month === renderedMonth) return;
    renderedMonth = month;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    for (const field of fields) drawField(field, time);
  }

  function syncTransform() {
    overlay.style.transform = ocean.style.transform;
  }

  const observer = new MutationObserver(syncTransform);
  observer.observe(ocean, { attributes: true, attributeFilter: ['style'] });
  syncTransform();
  refresh();
  window.setInterval(refresh, 500);
}
