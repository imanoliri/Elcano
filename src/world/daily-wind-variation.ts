import type { EastNorthVector, GeoPosition } from './coordinates';

const DAY_MS = 86_400_000;
const CELL_DEG = 15;
const LON_CELLS = 360 / CELL_DEG;
const LAT_CELLS = 180 / CELL_DEG;
const DEG = Math.PI / 180;

function hashUnit(value: string) {
  let state = 2166136261;
  for (const character of value) {
    state ^= character.charCodeAt(0);
    state = Math.imul(state, 16777619);
  }
  return (state >>> 0) / 2 ** 32;
}

function signedHash(value: string) {
  return hashUnit(value) * 2 - 1;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

function wrapIndex(value: number, size: number) {
  return ((value % size) + size) % size;
}

function temporalCornerNoise(channel: string, x: number, y: number, day: number, dayFraction: number) {
  const blend = smoothstep(dayFraction);
  const today = signedHash(`${channel}:${x}:${y}:${day}`);
  const tomorrow = signedHash(`${channel}:${x}:${y}:${day + 1}`);
  return lerp(today, tomorrow, blend);
}

/**
 * Smooth deterministic noise over roughly 15-degree synoptic cells.
 *
 * Values vary continuously in space and through each UTC day, avoiding visible
 * seams or midnight jumps while remaining reproducible for a given place/time.
 */
function synopticNoise(channel: string, position: GeoPosition, time: Date) {
  const longitude = ((position.lon + 180) % 360 + 360) % 360;
  const latitude = Math.max(-89.999, Math.min(89.999, position.lat));

  const gx = longitude / CELL_DEG;
  const gy = (latitude + 90) / CELL_DEG;
  const x0 = wrapIndex(Math.floor(gx), LON_CELLS);
  const x1 = wrapIndex(x0 + 1, LON_CELLS);
  const y0 = Math.max(0, Math.min(LAT_CELLS - 1, Math.floor(gy)));
  const y1 = Math.max(0, Math.min(LAT_CELLS - 1, y0 + 1));
  const fx = smoothstep(gx - Math.floor(gx));
  const fy = smoothstep(gy - Math.floor(gy));

  const dayFloat = time.getTime() / DAY_MS;
  const day = Math.floor(dayFloat);
  const dayFraction = dayFloat - day;

  const a = temporalCornerNoise(channel, x0, y0, day, dayFraction);
  const b = temporalCornerNoise(channel, x1, y0, day, dayFraction);
  const c = temporalCornerNoise(channel, x0, y1, day, dayFraction);
  const d = temporalCornerNoise(channel, x1, y1, day, dayFraction);

  return lerp(lerp(a, b, fx), lerp(c, d, fx), fy);
}

export type DailyWindVariation = {
  speedFactor: number;
  directionOffsetDeg: number;
};

/**
 * Deterministic day-scale variation around the monthly prevailing wind.
 *
 * The speed multiplier is symmetric around 1, so the climatological scalar
 * wind speed remains the long-term centre rather than being systematically
 * weakened or strengthened. Direction shifts are symmetric around 0 degrees.
 */
export function dailyWindVariationAt(position: GeoPosition, time: Date): DailyWindVariation {
  const speedNoise = synopticNoise('daily-wind-speed-v1', position, time);
  const directionNoise = synopticNoise('daily-wind-direction-v1', position, time);

  return {
    speedFactor: 1 + speedNoise * 0.65,
    directionOffsetDeg: directionNoise * 28,
  };
}

export function applyDailyWindVariation(
  baseWind: EastNorthVector,
  position: GeoPosition,
  time: Date,
): EastNorthVector {
  const baseSpeed = Math.hypot(baseWind.x, baseWind.y);
  if (baseSpeed < 0.01) return baseWind;

  const variation = dailyWindVariationAt(position, time);
  const baseBearing = Math.atan2(baseWind.x, baseWind.y);
  const bearing = baseBearing + variation.directionOffsetDeg * DEG;
  const speed = baseSpeed * variation.speedFactor;

  return {
    x: Math.sin(bearing) * speed,
    y: Math.cos(bearing) * speed,
  };
}
