import type { EastNorthVector, GeoPosition } from './coordinates';

const DAY_MS = 86_400_000;
const SYNOPTIC_PERIOD_DAYS = 3;
const SYNOPTIC_PERIOD_MS = SYNOPTIC_PERIOD_DAYS * DAY_MS;
const CELL_DEG = 18;
const LON_CELLS = 360 / CELL_DEG;
const LAT_CELLS = 180 / CELL_DEG;
const DEG = Math.PI / 180;

type VariationProfile = {
  speedAmplitude: number;
  directionAmplitudeDeg: number;
};

const PROFILES = {
  doldrums: { speedAmplitude: 0.70, directionAmplitudeDeg: 55 },
  trades: { speedAmplitude: 0.25, directionAmplitudeDeg: 12 },
  westerlies: { speedAmplitude: 0.45, directionAmplitudeDeg: 32 },
  monsoon: { speedAmplitude: 0.35, directionAmplitudeDeg: 22 },
  southernOcean: { speedAmplitude: 0.35, directionAmplitudeDeg: 20 },
} as const satisfies Record<string, VariationProfile>;

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

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function smoothstep(t: number) {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

function wrapIndex(value: number, size: number) {
  return ((value % size) + size) % size;
}

function blendProfile(a: VariationProfile, b: VariationProfile, t: number): VariationProfile {
  const amount = clamp01(t);
  return {
    speedAmplitude: lerp(a.speedAmplitude, b.speedAmplitude, amount),
    directionAmplitudeDeg: lerp(a.directionAmplitudeDeg, b.directionAmplitudeDeg, amount),
  };
}

function bandWeight(value: number, min: number, max: number, feather: number) {
  return smoothstep((value - min) / feather) * smoothstep((max - value) / feather);
}

function normalizedLongitude(lon: number) {
  return ((lon + 180) % 360 + 360) % 360 - 180;
}

/**
 * Regime-aware variability is blended at its boundaries so the chart never has
 * an artificial latitude/longitude seam where one wind regime becomes another.
 */
function variationProfileAt(position: GeoPosition): VariationProfile {
  const absLat = Math.abs(position.lat);
  let profile: VariationProfile = PROFILES.trades;

  // The ITCZ/doldrums are most variable close to the Equator, fading smoothly
  // into the steadier trades between about 5 and 10 degrees latitude.
  const doldrumsWeight = 1 - smoothstep((absLat - 5) / 5);
  profile = blendProfile(profile, PROFILES.doldrums, doldrumsWeight);

  // Trades give way gradually to the more changeable mid-latitude westerlies.
  const westerlyWeight = smoothstep((absLat - 26) / 8);
  profile = blendProfile(profile, PROFILES.westerlies, westerlyWeight);

  // South of the mid-30s the strong Southern Ocean baseline is somewhat steadier
  // than northern/mid-latitude westerlies; storms provide the large extremes.
  if (position.lat < 0) {
    const southernOceanWeight = smoothstep((absLat - 34) / 10);
    profile = blendProfile(profile, PROFILES.southernOcean, southernOceanWeight);
  }

  // The monthly climatology already carries the monsoon's seasonal reversal.
  // Here we only give monsoon-dominated waters their characteristic day-scale
  // variability. Feathered regional weights prevent hard geographic edges.
  const lon = normalizedLongitude(position.lon);
  const northIndian = bandWeight(position.lat, 5, 30, 5) * bandWeight(lon, 40, 120, 8);
  const maritimeAsia = bandWeight(position.lat, -15, 20, 5) * bandWeight(lon, 90, 150, 8);
  const monsoonWeight = Math.max(northIndian, maritimeAsia) * (1 - doldrumsWeight);
  profile = blendProfile(profile, PROFILES.monsoon, monsoonWeight);

  return profile;
}

function temporalCornerNoise(channel: string, x: number, y: number, period: number, fraction: number) {
  const blend = smoothstep(fraction);
  const current = signedHash(`${channel}:${x}:${y}:${period}`);
  const next = signedHash(`${channel}:${x}:${y}:${period + 1}`);
  return lerp(current, next, blend);
}

/**
 * Broad deterministic synoptic noise.
 *
 * Eighteen-degree cells are roughly 1,000 nautical miles north/south. Bilinear
 * interpolation makes neighbouring waters coherent, while three-day temporal
 * interpolation produces gradual evolution instead of daily dice rolls or
 * midnight discontinuities.
 */
function synopticNoise(channel: string, position: GeoPosition, time: Date) {
  const longitude = ((position.lon + 180) % 360 + 360) % 360;
  const latitude = Math.max(-89.999, Math.min(89.999, position.lat));

  const gx = longitude / CELL_DEG;
  const gy = (latitude + 90) / CELL_DEG;
  const xFloor = Math.floor(gx);
  const yFloor = Math.floor(gy);
  const x0 = wrapIndex(xFloor, LON_CELLS);
  const x1 = wrapIndex(x0 + 1, LON_CELLS);
  const y0 = Math.max(0, Math.min(LAT_CELLS - 1, yFloor));
  const y1 = Math.max(0, Math.min(LAT_CELLS - 1, y0 + 1));
  const fx = smoothstep(gx - xFloor);
  const fy = smoothstep(gy - yFloor);

  const periodFloat = time.getTime() / SYNOPTIC_PERIOD_MS;
  const period = Math.floor(periodFloat);
  const periodFraction = periodFloat - period;

  const a = temporalCornerNoise(channel, x0, y0, period, periodFraction);
  const b = temporalCornerNoise(channel, x1, y0, period, periodFraction);
  const c = temporalCornerNoise(channel, x0, y1, period, periodFraction);
  const d = temporalCornerNoise(channel, x1, y1, period, periodFraction);

  return lerp(lerp(a, b, fx), lerp(c, d, fx), fy);
}

export type DailyWindVariation = {
  speedFactor: number;
  directionOffsetDeg: number;
};

/**
 * Deterministic ordinary-weather variation around the prevailing monthly wind.
 *
 * Both perturbations are centred on the climatology: speed around 1.0x and
 * direction around 0 degrees. This layer can create calms, freshening winds and
 * meaningful shifts, but major gale/storm winds remain the responsibility of
 * the explicit weather-system layer.
 */
export function dailyWindVariationAt(position: GeoPosition, time: Date): DailyWindVariation {
  const profile = variationProfileAt(position);
  const speedNoise = synopticNoise('daily-wind-speed-v2', position, time);
  const directionNoise = synopticNoise('daily-wind-direction-v2', position, time);

  return {
    speedFactor: 1 + speedNoise * profile.speedAmplitude,
    directionOffsetDeg: directionNoise * profile.directionAmplitudeDeg,
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
