import type { EastNorthVector, GeoPosition } from './coordinates';

const DAY_MS = 86_400_000;
const WEATHER_EPOCH_MS = Date.UTC(1500, 0, 1);
const PRIMARY_CELL_DEG = 18;
const SECONDARY_CELL_DEG = 30;
const FAST_CELL_DEG = 6;
const FAST_DRIFT_MULTIPLIER = 3;
const DEG = Math.PI / 180;

type VariationProfile = {
  speedAmplitude: number;
  directionAmplitudeDeg: number;
  /** Positive moves anomalies east, negative moves them west. */
  driftKn: number;
  /** Share of ordinary variability carried by the smaller, faster field. */
  fastComponentWeight: number;
};

const PROFILES = {
  doldrums: { speedAmplitude: 0.70, directionAmplitudeDeg: 55, driftKn: -3, fastComponentWeight: 0.26 },
  trades: { speedAmplitude: 0.25, directionAmplitudeDeg: 12, driftKn: -7, fastComponentWeight: 0.30 },
  westerlies: { speedAmplitude: 0.45, directionAmplitudeDeg: 32, driftKn: 12, fastComponentWeight: 0.14 },
  monsoon: { speedAmplitude: 0.35, directionAmplitudeDeg: 22, driftKn: -4, fastComponentWeight: 0.26 },
  southernOcean: { speedAmplitude: 0.35, directionAmplitudeDeg: 20, driftKn: 15, fastComponentWeight: 0.12 },
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

function signedHash(value: string) {
  return hashUnit(value) * 2 - 1;
}

const rowStatsCache = new Map<string, { mean: number; scale: number }>();

function centeredCellValue(channel: string, x: number, y: number, lonCells: number) {
  const key = `${channel}:${y}:${lonCells}`;
  let stats = rowStatsCache.get(key);
  if (!stats) {
    const values = Array.from({ length: lonCells }, (_, index) => signedHash(`${channel}:${index}:${y}`));
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const scale = Math.max(0.0001, ...values.map((value) => Math.abs(value - mean)));
    stats = { mean, scale };
    rowStatsCache.set(key, stats);
  }
  return (signedHash(`${channel}:${x}:${y}`) - stats.mean) / stats.scale;
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
    driftKn: lerp(a.driftKn, b.driftKn, amount),
    fastComponentWeight: lerp(a.fastComponentWeight, b.fastComponentWeight, amount),
  };
}

function bandWeight(value: number, min: number, max: number, feather: number) {
  return smoothstep((value - min) / feather) * smoothstep((max - value) / feather);
}

function normalizedLongitude(lon: number) {
  return ((lon + 180) % 360 + 360) % 360 - 180;
}

/**
 * Regime-aware variability and anomaly motion are blended at their boundaries so
 * the chart never has an artificial seam where one wind regime becomes another.
 */
function variationProfileAt(position: GeoPosition): VariationProfile {
  const absLat = Math.abs(position.lat);
  let profile: VariationProfile = PROFILES.trades;

  // The ITCZ/doldrums are fickle and relatively slow-moving, fading smoothly
  // into the steadier westward-moving trade-wind regime.
  const doldrumsWeight = 1 - smoothstep((absLat - 5) / 5);
  profile = blendProfile(profile, PROFILES.doldrums, doldrumsWeight);

  // Trades give way gradually to eastward-moving, more changeable westerlies.
  const westerlyWeight = smoothstep((absLat - 26) / 8);
  profile = blendProfile(profile, PROFILES.westerlies, westerlyWeight);

  // Southern Ocean anomalies move faster eastward than ordinary westerly weather.
  if (position.lat < 0) {
    const southernOceanWeight = smoothstep((absLat - 34) / 10);
    profile = blendProfile(profile, PROFILES.southernOcean, southernOceanWeight);
  }

  // The monthly climatology already carries the monsoon's seasonal reversal.
  // Day-scale monsoon anomalies drift more slowly and mainly westward in this
  // readable abstraction; the monthly field remains the dominant seasonal signal.
  const lon = normalizedLongitude(position.lon);
  const northIndian = bandWeight(position.lat, 5, 30, 5) * bandWeight(lon, 40, 120, 8);
  const maritimeAsia = bandWeight(position.lat, -15, 20, 5) * bandWeight(lon, 90, 150, 8);
  const monsoonWeight = Math.max(northIndian, maritimeAsia) * (1 - doldrumsWeight);
  profile = blendProfile(profile, PROFILES.monsoon, monsoonWeight);

  return profile;
}

function advectedLongitude(position: GeoPosition, days: number, driftKn: number) {
  const cosLat = Math.max(0.25, Math.cos(position.lat * DEG));
  const degreesPerDay = driftKn * 24 / (60 * cosLat);
  // Sample the upstream source point so a positive drift makes patterns move east.
  return position.lon - degreesPerDay * days;
}

/**
 * Smooth deterministic value noise sampled from a wrapped longitude grid.
 */
function spatialNoise(channel: string, position: GeoPosition, cellDeg: number) {
  const lonCells = Math.round(360 / cellDeg);
  const latCells = Math.round(180 / cellDeg);
  const longitude = ((position.lon + 180) % 360 + 360) % 360;
  const latitude = Math.max(-89.999, Math.min(89.999, position.lat));

  const gx = longitude / cellDeg;
  const gy = (latitude + 90) / cellDeg;
  const xFloor = Math.floor(gx);
  const yFloor = Math.floor(gy);
  const x0 = wrapIndex(xFloor, lonCells);
  const x1 = wrapIndex(x0 + 1, lonCells);
  const y0 = Math.max(0, Math.min(latCells - 1, yFloor));
  const y1 = Math.max(0, Math.min(latCells - 1, y0 + 1));
  const fx = smoothstep(gx - xFloor);
  const fy = smoothstep(gy - yFloor);

  const a = centeredCellValue(channel, x0, y0, lonCells);
  const b = centeredCellValue(channel, x1, y0, lonCells);
  const c = centeredCellValue(channel, x0, y1, lonCells);
  const d = centeredCellValue(channel, x1, y1, lonCells);

  return lerp(lerp(a, b, fx), lerp(c, d, fx), fy);
}

/**
 * Broad moving synoptic anomalies.
 *
 * Rather than oscillating in place, three deterministic spatial fields are
 * advected across the ocean. Broad primary/secondary fields define the synoptic
 * pattern, while a weaker ~350 nm field moves faster. Tropical regimes assign
 * more weight to that fast component so trades and monsoons visibly evolve over
 * several days without increasing their overall amplitude envelope.
 */
function synopticNoise(
  channel: string,
  position: GeoPosition,
  time: Date,
  driftKn: number,
  fastComponentWeight: number,
) {
  const days = (time.getTime() - WEATHER_EPOCH_MS) / DAY_MS;

  const primary: GeoPosition = {
    lat: position.lat,
    lon: advectedLongitude(position, days, driftKn),
  };
  const secondary: GeoPosition = {
    lat: position.lat,
    lon: advectedLongitude(position, days, driftKn * 0.55),
  };
  const fast: GeoPosition = {
    lat: position.lat,
    lon: advectedLongitude(position, days, driftKn * FAST_DRIFT_MULTIPLIER),
  };

  const fastWeight = Math.max(0, Math.min(0.35, fastComponentWeight));
  const broadWeight = 1 - fastWeight;

  return (
    spatialNoise(`${channel}:primary-v4`, primary, PRIMARY_CELL_DEG) * broadWeight * 0.72
    + spatialNoise(`${channel}:secondary-v4`, secondary, SECONDARY_CELL_DEG) * broadWeight * 0.28
    + spatialNoise(`${channel}:fast-v4`, fast, FAST_CELL_DEG) * fastWeight
  );
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
  const speedNoise = synopticNoise('daily-wind-speed', position, time, profile.driftKn, profile.fastComponentWeight);
  const directionNoise = synopticNoise('daily-wind-direction', position, time, profile.driftKn, profile.fastComponentWeight);

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
