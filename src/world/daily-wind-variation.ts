import type { EastNorthVector, GeoPosition } from './coordinates';

const DAY_MS = 86_400_000;
const WEATHER_EPOCH_MS = Date.UTC(1500, 0, 1);
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
  state ^= state >>> 16;
  state = Math.imul(state, 0x85ebca6b);
  state ^= state >>> 13;
  state = Math.imul(state, 0xc2b2ae35);
  state ^= state >>> 16;
  return (state >>> 0) / 2 ** 32;
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

function cornerWave(channel: string, x: number, y: number, days: number) {
  const phaseA = hashUnit(`${channel}:${x}:${y}:phase-a`) * Math.PI * 2;
  const phaseB = hashUnit(`${channel}:${x}:${y}:phase-b`) * Math.PI * 2;
  const periodA = 2.6 + hashUnit(`${channel}:${x}:${y}:period-a`) * 1.8;
  const periodB = 5.5 + hashUnit(`${channel}:${x}:${y}:period-b`) * 3;

  return (
    Math.sin(days / periodA * Math.PI * 2 + phaseA) * 0.72
    + Math.sin(days / periodB * Math.PI * 2 + phaseB) * 0.28
  );
}

/**
 * Broad deterministic synoptic variation.
 *
 * Eighteen-degree cells are roughly 1,000 nautical miles north/south. Bilinear
 * interpolation keeps neighbouring waters coherent. Each cell combines a
 * dominant 2.6–4.4 day cycle with a slower 5.5–8.5 day component, guaranteeing
 * smooth short-term evolution without midnight jumps or independent daily rolls.
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

  const days = (time.getTime() - WEATHER_EPOCH_MS) / DAY_MS;

  const a = cornerWave(channel, x0, y0, days);
  const b = cornerWave(channel, x1, y0, days);
  const c = cornerWave(channel, x0, y1, days);
  const d = cornerWave(channel, x1, y1, days);

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
