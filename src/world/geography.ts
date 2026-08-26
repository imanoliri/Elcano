import landTopology from 'world-atlas/land-50m.json';
import { feature } from 'topojson-client';
import { WORLD_MAP_HEIGHT, WORLD_MAP_WIDTH, type GeoPosition } from './coordinates';

type GeoJsonGeometry = {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][] | number[][][][];
};

type GeoJsonFeature = { geometry: GeoJsonGeometry | null };
type GeoJsonFeatureCollection = { type: 'FeatureCollection'; features: GeoJsonFeature[] };
type LandGeoJson = GeoJsonFeature | GeoJsonFeatureCollection;
type IndexedPolygon = {
  rings: number[][][];
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
};

type UnwrappedPoint = { x: number; y: number };

const land = feature(
  landTopology as never,
  (landTopology as { objects: { land: unknown } }).objects.land as never,
) as unknown as LandGeoJson;

function polygonsFromGeometry(value: GeoJsonGeometry | null): number[][][][] {
  if (!value) return [];
  if (value.type === 'Polygon') return [value.coordinates as number[][][]];
  return value.coordinates as number[][][][];
}

function allPolygons() {
  if ('features' in land) return land.features.flatMap((item) => polygonsFromGeometry(item.geometry));
  return polygonsFromGeometry(land.geometry);
}

const indexedPolygons: IndexedPolygon[] = allPolygons().map((rings) => {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;
  for (const ring of rings) {
    for (const [lon, lat] of ring) {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
    }
  }
  return { rings, minLat, maxLat, minLon, maxLon };
});

let cachedLandPath: Path2D | null = null;

function unwrapRing(coordinates: number[][]): UnwrappedPoint[] {
  if (coordinates.length === 0) return [];

  const points: UnwrappedPoint[] = [];
  let previousLon = coordinates[0][0];

  for (let index = 0; index < coordinates.length; index += 1) {
    const [rawLon, lat] = coordinates[index];
    let lon = rawLon;

    if (index > 0) {
      while (lon - previousLon > 180) lon -= 360;
      while (lon - previousLon < -180) lon += 360;
    }

    previousLon = lon;
    points.push({
      x: (lon + 180) / 360 * WORLD_MAP_WIDTH,
      y: (90 - lat) / 180 * WORLD_MAP_HEIGHT,
    });
  }

  return points;
}

function appendShiftedRing(path: Path2D, points: UnwrappedPoint[], shiftX: number) {
  points.forEach((point, index) => {
    const x = point.x + shiftX;
    if (index === 0) path.moveTo(x, point.y);
    else path.lineTo(x, point.y);
  });
  path.closePath();
}

function appendRing(path: Path2D, coordinates: number[][]) {
  const points = unwrapRing(coordinates);
  if (points.length === 0) return;

  let minX = Infinity;
  let maxX = -Infinity;
  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
  }

  // A ring that crosses ±180° is kept locally continuous by unwrapping its
  // longitudes outside the canonical chart. Draw each shifted copy that
  // intersects [0, WORLD_MAP_WIDTH], rather than joining the two seam points
  // with a line across the entire world.
  const minShift = Math.ceil(-maxX / WORLD_MAP_WIDTH);
  const maxShift = Math.floor((WORLD_MAP_WIDTH - minX) / WORLD_MAP_WIDTH);
  for (let shift = minShift; shift <= maxShift; shift += 1) {
    appendShiftedRing(path, points, shift * WORLD_MAP_WIDTH);
  }
}

function landPath() {
  if (cachedLandPath) return cachedLandPath;
  const path = new Path2D();
  for (const polygon of indexedPolygons) {
    for (const ring of polygon.rings) appendRing(path, ring);
  }
  cachedLandPath = path;
  return path;
}

function pointInRing(position: GeoPosition, coordinates: number[][]) {
  let inside = false;
  const x = position.lon;
  const y = position.lat;

  for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
    const [xi, yi] = coordinates[i];
    const [xj, yj] = coordinates[j];
    const crosses = (yi > y) !== (yj > y);
    if (!crosses) continue;
    const edgeX = ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (x < edgeX) inside = !inside;
  }
  return inside;
}

function pointInPolygon(position: GeoPosition, polygon: number[][][]) {
  if (polygon.length === 0 || !pointInRing(position, polygon[0])) return false;
  for (let i = 1; i < polygon.length; i += 1) {
    if (pointInRing(position, polygon[i])) return false;
  }
  return true;
}

export function isLand(position: GeoPosition) {
  for (const polygon of indexedPolygons) {
    if (
      position.lat < polygon.minLat || position.lat > polygon.maxLat ||
      position.lon < polygon.minLon || position.lon > polygon.maxLon
    ) continue;
    if (pointInPolygon(position, polygon.rings)) return true;
  }
  return false;
}

export function drawLandMask(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.fillStyle = '#000';
  ctx.fill(landPath(), 'evenodd');
  ctx.restore();
}

export function drawLand(ctx: CanvasRenderingContext2D) {
  ctx.save();
  const path = landPath();
  ctx.fillStyle = '#7f7253';
  ctx.strokeStyle = 'rgba(224, 211, 170, .62)';
  ctx.lineWidth = 0.9;
  ctx.fill(path, 'evenodd');
  ctx.stroke(path);
  ctx.restore();
}
