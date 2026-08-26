import type { EastNorthVector, GeoPosition } from './coordinates';
import type { EnvironmentProvider } from './environment';

export type EnvironmentBounds = {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
};

type ErddapPayload = {
  table?: {
    columnNames?: string[];
    rows?: unknown[][];
  };
};

type SampleGrid = {
  lats: number[];
  lons: number[];
  east: Float32Array;
  north: Float32Array;
};

type EnvironmentTile = {
  key: string;
  month: number;
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
  wind: SampleGrid | null;
  current: SampleGrid | null;
  touchedAt: number;
};

const WIND_URL = 'https://oceanwatch.pifsc.noaa.gov/erddap/griddap/ccmp-monthly-v2-0.json';
const CURRENT_URL = 'https://coastwatch.pfeg.noaa.gov/erddap/griddap/jplOscar.json';
const TILE_DEG = 20;
const REFERENCE_YEAR = 2012;
const MAX_CACHE_TILES = 32;
const MAX_PREFETCH_TILES = 12;
const MS_TO_KNOTS = 1.9438444924406;
const cache = new Map<string, EnvironmentTile>();
const pending = new Map<string, Promise<EnvironmentTile | null>>();
const failedAt = new Map<string, number>();

const REGIONAL_WIND = { minLat: 41.125, maxLat: 46.375, minLon: -11.375, maxLon: 0.875 };
const REGIONAL_CURRENT = { minLat: 41.04, maxLat: 46.48, minLon: -11.44, maxLon: 0.96 };
const REGIONAL_VIEW = { minLat: 40.8, maxLat: 46.7, minLon: -11.7, maxLon: 1.2 };

function inside(bounds: EnvironmentBounds, position: GeoPosition) {
  return position.lat >= bounds.minLat && position.lat <= bounds.maxLat && position.lon >= bounds.minLon && position.lon <= bounds.maxLon;
}

function viewInsideRegional(bounds: EnvironmentBounds) {
  return bounds.minLat >= REGIONAL_VIEW.minLat && bounds.maxLat <= REGIONAL_VIEW.maxLat && bounds.minLon >= REGIONAL_VIEW.minLon && bounds.maxLon <= REGIONAL_VIEW.maxLon;
}

function normalizeLon(lon: number) {
  let value = lon;
  while (value < -180) value += 360;
  while (value >= 180) value -= 360;
  return value;
}

function windSourceLon(lon: number) {
  const normalized = normalizeLon(lon);
  return normalized < 0 ? normalized + 360 : normalized;
}

function currentSourceLon(lon: number) {
  const normalized = normalizeLon(lon);
  const positive = normalized < 0 ? normalized + 360 : normalized;
  return positive < 20 ? positive + 360 : positive;
}

function tileOrigin(value: number, minimum: number) {
  return Math.floor((value - minimum) / TILE_DEG) * TILE_DEG + minimum;
}

function tileSpec(position: GeoPosition, month: number) {
  const lat = Math.max(-79.999, Math.min(79.999, position.lat));
  const lon = normalizeLon(position.lon);
  const minLat = tileOrigin(lat, -80);
  const minLon = tileOrigin(lon, -180);
  const maxLat = Math.min(80, minLat + TILE_DEG);
  const maxLon = Math.min(180, minLon + TILE_DEG);
  return {
    key: `${month}:${minLat}:${minLon}`,
    month,
    minLat,
    maxLat,
    minLon,
    maxLon,
  };
}

function representativeDate(month: number) {
  return `${REFERENCE_YEAR}-${String(month + 1).padStart(2, '0')}-15T00:00:00Z`;
}

function queryUrl(base: string, query: string) {
  return `${base}?${encodeURIComponent(query).replaceAll('%2C', ',').replaceAll('%5B', '[').replaceAll('%5D', ']').replaceAll('%3A', ':')}`;
}

async function fetchRows(url: string, query: string) {
  const response = await fetch(queryUrl(url, query), { mode: 'cors', cache: 'force-cache' });
  if (!response.ok) throw new Error(`${response.status} fetching environment tile`);
  const payload = await response.json() as ErddapPayload;
  const names = payload.table?.columnNames ?? [];
  const rows = payload.table?.rows ?? [];
  return rows.map((row) => Object.fromEntries(names.map((name, index) => [name, row[index]])));
}

function asNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function buildGrid(rows: Record<string, unknown>[], eastName: string, northName: string): SampleGrid | null {
  const points: Array<{ lat: number; lon: number; east: number; north: number }> = [];
  for (const row of rows) {
    const lat = asNumber(row.latitude);
    const rawLon = asNumber(row.longitude);
    const east = asNumber(row[eastName]);
    const north = asNumber(row[northName]);
    if (lat === null || rawLon === null || east === null || north === null) continue;
    points.push({ lat, lon: normalizeLon(rawLon), east: east * MS_TO_KNOTS, north: north * MS_TO_KNOTS });
  }
  if (!points.length) return null;

  const lats = [...new Set(points.map((point) => Number(point.lat.toFixed(5))))].sort((a, b) => a - b);
  const lons = [...new Set(points.map((point) => Number(point.lon.toFixed(5))))].sort((a, b) => a - b);
  const east = new Float32Array(lats.length * lons.length).fill(Number.NaN);
  const north = new Float32Array(lats.length * lons.length).fill(Number.NaN);
  const latIndex = new Map(lats.map((value, index) => [value, index]));
  const lonIndex = new Map(lons.map((value, index) => [value, index]));

  for (const point of points) {
    const y = latIndex.get(Number(point.lat.toFixed(5)));
    const x = lonIndex.get(Number(point.lon.toFixed(5)));
    if (x === undefined || y === undefined) continue;
    const index = y * lons.length + x;
    east[index] = point.east;
    north[index] = point.north;
  }
  return { lats, lons, east, north };
}

function nearestIndex(values: number[], value: number) {
  if (values.length <= 1) return 0;
  let low = 0;
  let high = values.length - 1;
  while (low + 1 < high) {
    const middle = (low + high) >> 1;
    if (values[middle] <= value) low = middle;
    else high = middle;
  }
  return Math.abs(values[low] - value) <= Math.abs(values[high] - value) ? low : high;
}

function sampleGrid(grid: SampleGrid | null, position: GeoPosition): EastNorthVector | null {
  if (!grid || !grid.lats.length || !grid.lons.length) return null;
  const y = nearestIndex(grid.lats, position.lat);
  const x = nearestIndex(grid.lons, normalizeLon(position.lon));
  const index = y * grid.lons.length + x;
  const east = grid.east[index];
  const north = grid.north[index];
  return Number.isFinite(east) && Number.isFinite(north) ? { x: east, y: north } : null;
}

async function fetchWind(spec: ReturnType<typeof tileSpec>) {
  const date = representativeDate(spec.month);
  const west = windSourceLon(spec.minLon);
  const east = windSourceLon(spec.maxLon === 180 ? 179.999 : spec.maxLon);
  const startLon = Math.min(west, east);
  const endLon = Math.max(west, east);
  const dimensions = `[( ${date} )][(${spec.minLat}):4:(${spec.maxLat})][(${startLon}):4:(${endLon})]`.replaceAll(' ', '');
  const rows = await fetchRows(WIND_URL, `uwnd${dimensions},vwnd${dimensions}`);
  return buildGrid(rows, 'uwnd', 'vwnd');
}

async function fetchCurrent(spec: ReturnType<typeof tileSpec>) {
  const date = representativeDate(spec.month);
  const west = currentSourceLon(spec.minLon);
  const east = currentSourceLon(spec.maxLon === 180 ? 179.999 : spec.maxLon);
  const startLon = Math.min(west, east);
  const endLon = Math.max(west, east);
  const dimensions = `[(${date})][(15)][(${spec.maxLat}):3:(${spec.minLat})][(${startLon}):3:(${endLon})]`;
  const rows = await fetchRows(CURRENT_URL, `u${dimensions},v${dimensions}`);
  return buildGrid(rows, 'u', 'v');
}

function pruneCache() {
  if (cache.size <= MAX_CACHE_TILES) return;
  const oldest = [...cache.values()].sort((a, b) => a.touchedAt - b.touchedAt);
  for (const tile of oldest.slice(0, cache.size - MAX_CACHE_TILES)) cache.delete(tile.key);
}

async function loadTile(spec: ReturnType<typeof tileSpec>): Promise<EnvironmentTile | null> {
  const recentFailure = failedAt.get(spec.key);
  if (recentFailure && Date.now() - recentFailure < 60_000) return null;
  try {
    const [wind, current] = await Promise.all([
      fetchWind(spec).catch(() => null),
      fetchCurrent(spec).catch(() => null),
    ]);
    if (!wind && !current) throw new Error('No remote environment data');
    const tile: EnvironmentTile = { ...spec, wind, current, touchedAt: performance.now() };
    cache.set(spec.key, tile);
    failedAt.delete(spec.key);
    pruneCache();
    window.dispatchEvent(new CustomEvent('elcano:environment-data-change', { detail: { key: spec.key } }));
    return tile;
  } catch {
    failedAt.set(spec.key, Date.now());
    return null;
  }
}

function ensureTile(position: GeoPosition, time: Date) {
  if (Math.abs(position.lat) >= 80) return Promise.resolve(null);
  const spec = tileSpec(position, time.getUTCMonth());
  const cached = cache.get(spec.key);
  if (cached) {
    cached.touchedAt = performance.now();
    return Promise.resolve(cached);
  }
  const active = pending.get(spec.key);
  if (active) return active;
  const request = loadTile(spec).finally(() => pending.delete(spec.key));
  pending.set(spec.key, request);
  return request;
}

function cachedTile(position: GeoPosition, time: Date) {
  const spec = tileSpec(position, time.getUTCMonth());
  const tile = cache.get(spec.key);
  if (tile) tile.touchedAt = performance.now();
  return tile ?? null;
}

export function createGlobalTiledEnvironment(fallback: EnvironmentProvider): EnvironmentProvider {
  return {
    id: 'lazy-global-observed-environment-v1',
    label: 'Regional climatology + lazy global observed tiles',
    windAt(position, time) {
      if (inside(REGIONAL_WIND, position)) return fallback.windAt(position, time);
      const tile = cachedTile(position, time);
      if (!tile) void ensureTile(position, time);
      return sampleGrid(tile?.wind ?? null, position) ?? fallback.windAt(position, time);
    },
    currentAt(position, time) {
      if (inside(REGIONAL_CURRENT, position)) return fallback.currentAt(position, time);
      const tile = cachedTile(position, time);
      if (!tile) void ensureTile(position, time);
      return sampleGrid(tile?.current ?? null, position) ?? fallback.currentAt(position, time);
    },
  };
}

export async function prefetchGlobalEnvironment(bounds: EnvironmentBounds, time: Date) {
  if (viewInsideRegional(bounds)) return;
  const minLat = Math.max(-79.9, Math.min(79.9, bounds.minLat));
  const maxLat = Math.max(-79.9, Math.min(79.9, bounds.maxLat));
  const minLon = Math.max(-179.9, Math.min(179.9, bounds.minLon));
  const maxLon = Math.max(-179.9, Math.min(179.9, bounds.maxLon));
  const centerLat = (minLat + maxLat) / 2;
  const centerLon = (minLon + maxLon) / 2;
  const month = time.getUTCMonth();
  const candidates: Array<{ position: GeoPosition; distance: number }> = [];

  for (let lat = tileOrigin(minLat, -80); lat <= tileOrigin(maxLat, -80); lat += TILE_DEG) {
    for (let lon = tileOrigin(minLon, -180); lon <= tileOrigin(maxLon, -180); lon += TILE_DEG) {
      const position = { lat: Math.min(79.9, lat + TILE_DEG / 2), lon: normalizeLon(lon + TILE_DEG / 2) };
      const distance = (position.lat - centerLat) ** 2 + (normalizeLon(position.lon - centerLon)) ** 2;
      candidates.push({ position, distance });
    }
  }

  await Promise.all(candidates.sort((a, b) => a.distance - b.distance).slice(0, MAX_PREFETCH_TILES).map(({ position }) => {
    const spec = tileSpec(position, month);
    if (cache.has(spec.key)) return Promise.resolve(cache.get(spec.key) ?? null);
    return ensureTile(position, time);
  }));
}

export function globalEnvironmentTileStats() {
  return { loaded: cache.size, pending: pending.size, failed: failedAt.size };
}
