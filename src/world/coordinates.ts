export type GeoPosition = { lat: number; lon: number };
export type MapPoint = { x: number; y: number };
export type EastNorthVector = { x: number; y: number };

export const WORLD_MAP_WIDTH = 1440;
export const WORLD_MAP_HEIGHT = 720;
const MAX_MERCATOR_LAT = 85.05112878;
const DEG = Math.PI / 180;

export function clampLatitude(lat: number) {
  return Math.max(-MAX_MERCATOR_LAT, Math.min(MAX_MERCATOR_LAT, lat));
}

export function normalizeLongitude(lon: number) {
  return ((lon + 540) % 360) - 180;
}

/** Web Mercator projection used only for chart rendering/camera coordinates. */
export function project(position: GeoPosition): MapPoint {
  const lon = normalizeLongitude(position.lon);
  const lat = clampLatitude(position.lat);
  const x = (lon + 180) / 360 * WORLD_MAP_WIDTH;
  const mercatorY = Math.log(Math.tan(Math.PI / 4 + lat * DEG / 2));
  const y = (1 - mercatorY / Math.PI) / 2 * WORLD_MAP_HEIGHT;
  return { x, y };
}

export function unproject(point: MapPoint): GeoPosition {
  const lon = point.x / WORLD_MAP_WIDTH * 360 - 180;
  const n = Math.PI - 2 * Math.PI * point.y / WORLD_MAP_HEIGHT;
  const lat = Math.atan(Math.sinh(n)) / DEG;
  return { lat: clampLatitude(lat), lon: normalizeLongitude(lon) };
}

/** Move by east/north nautical miles using a local tangent-plane approximation. */
export function offsetByNauticalMiles(position: GeoPosition, eastNm: number, northNm: number): GeoPosition {
  const lat = clampLatitude(position.lat + northNm / 60);
  const cosLat = Math.max(0.05, Math.cos(position.lat * DEG));
  const lon = normalizeLongitude(position.lon + eastNm / (60 * cosLat));
  return { lat, lon };
}

export function greatCircleDistanceNm(a: GeoPosition, b: GeoPosition) {
  const lat1 = a.lat * DEG;
  const lat2 = b.lat * DEG;
  const dLat = (b.lat - a.lat) * DEG;
  const dLon = normalizeLongitude(b.lon - a.lon) * DEG;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 3440.065 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
