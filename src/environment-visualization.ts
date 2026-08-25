import { currentAt, windAt, type Vec2 } from './simulation';
import { project } from './world/coordinates';

const canvas = document.querySelector<HTMLCanvasElement>('#ocean');
const shell = document.querySelector<HTMLElement>('.game-shell');

if (canvas && shell) {
  const ctx = canvas.getContext('2d');
  const sampleTime = new Date('1525-07-01T12:00:00Z');

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
    vectorLength: number;
  };

  const fields: Field[] = [
    {
      minLat: 41.125,
      maxLat: 46.375,
      minLon: -11.375,
      maxLon: 0.875,
      step: 0.25,
      vectorAt: windAt,
      strokeStyle: 'rgba(255,255,255,.52)',
      lineWidth: 0.12,
      vectorLength: 0.72,
    },
    {
      minLat: 41.04,
      maxLat: 46.48,
      minLon: -11.44,
      maxLon: 0.96,
      step: 0.08,
      vectorAt: currentAt,
      strokeStyle: 'rgba(74,213,255,.58)',
      lineWidth: 0.08,
      vectorLength: 0.28,
    },
  ];

  function drawField(field: Field) {
    if (!ctx) return;
    ctx.save();
    ctx.strokeStyle = field.strokeStyle;
    ctx.lineWidth = field.lineWidth;
    ctx.beginPath();

    for (let lat = field.minLat; lat <= field.maxLat + field.step / 2; lat += field.step) {
      for (let lon = field.minLon; lon <= field.maxLon + field.step / 2; lon += field.step) {
        const position = { lat, lon };
        const vector = field.vectorAt(position, sampleTime);
        const magnitude = Math.hypot(vector.x, vector.y);
        if (!Number.isFinite(magnitude) || magnitude < 0.0001) continue;

        const p = project(position);
        const dx = vector.x / magnitude * field.vectorLength;
        const dy = -vector.y / magnitude * field.vectorLength;
        ctx.moveTo(p.x - dx * 0.5, p.y - dy * 0.5);
        ctx.lineTo(p.x + dx * 0.5, p.y + dy * 0.5);
      }
    }

    ctx.stroke();
    ctx.restore();
  }

  function drawHighResolutionEnvironment() {
    if (!ctx) return;
    for (const field of fields) drawField(field);
    requestAnimationFrame(drawHighResolutionEnvironment);
  }

  requestAnimationFrame(drawHighResolutionEnvironment);
}
