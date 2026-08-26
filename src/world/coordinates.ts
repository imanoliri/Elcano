export type GeoPosition = { lat: number; lon: number };
export type MapPoint = { x: number; y: number };
export type EastNorthVector = { x: number; y: number };

export const WORLD_MAP_WIDTH = 1440;
export const WORLD_MAP_HEIGHT = 720;
const DEG = Math.PI / 180;

export function clampLatitude(lat: number) {
  return Math.max(-90, Math.min(90, lat));
}

export function normalizeLongitude(lon: number) {
  return ((lon + 540) % 360) - 180;
}

/**
 * Pole-complete equirectangular projection used only for chart rendering and
 * camera coordinates.
 *
 * Elcano previously rendered through Web Mercator, whose vertical edges stop
 * at ±85.051°. Those edges cannot be crossed as if they were geographic poles.
 * A 2:1 equirectangular chart includes the real ±90° poles, so the camera can
 * continue across them by reflecting latitude and rotating longitude 180°.
 * Simulation state remains ordinary latitude/longitude and is independent of
 * this rendering projection.
 */
export function project(position: GeoPosition): MapPoint {
  const lon = normalizeLongitude(position.lon);
  const lat = clampLatitude(position.lat);
  return {
    x: (lon + 180) / 360 * WORLD_MAP_WIDTH,
    y: (90 - lat) / 180 * WORLD_MAP_HEIGHT,
  };
}

export function unproject(point: MapPoint): GeoPosition {
  return {
    lat: clampLatitude(90 - point.y / WORLD_MAP_HEIGHT * 180),
    lon: normalizeLongitude(point.x / WORLD_MAP_WIDTH * 360 - 180),
  };
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
