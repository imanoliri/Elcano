import { readFile } from 'node:fs/promises';

const SOURCE = new URL('../src/world/data/atlantic-climatology.generated.ts', import.meta.url);
const points = [
  ['San Sebastián', 43.3183, -1.9812],
  ['Bilbao', 43.35, -3.05],
  ['Santander', 43.55, -3.8],
  ['Gijón', 43.62, -5.67],
  ['Ribadeo', 43.57, -7.04],
  ['A Coruña', 43.3623, -8.4115],
];

function parseGenerated(source) {
  const prefix = 'export const ATLANTIC_CLIMATOLOGY = ';
  const start = source.indexOf(prefix);
  const end = source.lastIndexOf(' as const;');
  if (start < 0 || end < 0) throw new Error('Unable to parse generated Atlantic climatology');
  return JSON.parse(source.slice(start + prefix.length, end));
}

function decode(grid) {
  const buffer = Buffer.from(grid.packed, 'base64');
  return new Int16Array(buffer.buffer, buffer.byteOffset, Math.floor(buffer.byteLength / Int16Array.BYTES_PER_ELEMENT));
}

function sample(grid, data, lat, lon, month, component) {
  if (component >= grid.components) return null;
  const latFloat = (lat - grid.minLat) / grid.stepDeg;
  const lonFloat = (lon - grid.minLon) / grid.stepDeg;
  const lat0 = Math.max(0, Math.min(grid.latCount - 1, Math.floor(latFloat)));
  const lon0 = Math.max(0, Math.min(grid.lonCount - 1, Math.floor(lonFloat)));
  const lat1 = Math.min(grid.latCount - 1, lat0 + 1);
  const lon1 = Math.min(grid.lonCount - 1, lon0 + 1);
  const fy = Math.max(0, Math.min(1, latFloat - lat0));
  const fx = Math.max(0, Math.min(1, lonFloat - lon0));
  const corners = [
    [lat0, lon0, (1 - fx) * (1 - fy)],
    [lat0, lon1, fx * (1 - fy)],
    [lat1, lon0, (1 - fx) * fy],
    [lat1, lon1, fx * fy],
  ];
  let weighted = 0;
  let total = 0;
  for (const [y, x, weight] of corners) {
    if (weight <= 0) continue;
    const index = (((month * grid.latCount + y) * grid.lonCount + x) * grid.components) + component;
    const raw = data[index];
    if (raw === grid.missing) continue;
    weighted += raw / grid.scale * weight;
    total += weight;
  }
  return total > 0 ? weighted / total : null;
}

const generated = parseGenerated(await readFile(SOURCE, 'utf8'));
const grid = generated.wind;
if (grid.components < 3) throw new Error(`Expected u/v/wspd wind grid, got ${grid.components} components`);
const data = decode(grid);
const july = 6;

console.log('July Biscay wind climatology (knots)');
console.log('Place | old hypot(mean u,v) | CCMP mean wspd | prevailing toward');
for (const [name, lat, lon] of points) {
  const u = sample(grid, data, lat, lon, july, 0);
  const v = sample(grid, data, lat, lon, july, 1);
  const wspd = sample(grid, data, lat, lon, july, 2);
  if (u === null || v === null || wspd === null) throw new Error(`Missing July wind at ${name}`);
  const oldSpeed = Math.hypot(u, v);
  // Mean scalar speed should not materially undershoot the magnitude of the
  // mean vector. Small tolerance covers packing/interpolation rounding.
  if (wspd + 0.08 < oldSpeed) throw new Error(`Invalid scalar wind speed at ${name}: ${wspd.toFixed(2)} < ${oldSpeed.toFixed(2)}`);
  const toward = (Math.atan2(u, v) * 180 / Math.PI + 360) % 360;
  console.log(`${name} | ${oldSpeed.toFixed(2)} | ${wspd.toFixed(2)} | ${toward.toFixed(0)}°`);
}
