import landTopology from 'world-atlas/land-10m.json';
import { feature } from 'topojson-client';
import { WORLD_MAP_HEIGHT, WORLD_MAP_WIDTH } from './coordinates';

type GeoJsonGeometry = {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][] | number[][][][];
};
type GeoJsonFeature = { geometry: GeoJsonGeometry | null };
type GeoJsonFeatureCollection = { type: 'FeatureCollection'; features: GeoJsonFeature[] };
type LandGeoJson = GeoJsonFeature | GeoJsonFeatureCollection;
export type WorldBounds = { minX: number; minY: number; maxX: number; maxY: number };
type DetailChunk = WorldBounds & { path: Path2D };
type UnwrappedPoint = { x: number; y: number };

const land = feature(
  landTopology as never,
  (landTopology as { objects: { land: unknown } }).objects.land as never,
) as unknown as LandGeoJson;

function polygons(value: GeoJsonGeometry | null): number[][][][] {
  if (!value) return [];
  if (value.type === 'Polygon') return [value.coordinates as number[][][]];
  return value.coordinates as number[][][][];
}

function allPolygons() {
  if ('features' in land) return land.features.flatMap((item) => polygons(item.geometry));
  return polygons(land.geometry);
}

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
      y: (90 - Math.max(-90, Math.min(90, lat))) / 180 * WORLD_MAP_HEIGHT,
    });
  }
  return points;
}

function boundsFor(points: UnwrappedPoint[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  return { minX, minY, maxX, maxY };
}

function alignRing(points: UnwrappedPoint[], referenceMidX: number) {
  if (points.length === 0) return points;
  const bounds = boundsFor(points);
  const midX = (bounds.minX + bounds.maxX) / 2;
  const shift = Math.round((referenceMidX - midX) / WORLD_MAP_WIDTH) * WORLD_MAP_WIDTH;
  return shift === 0 ? points : points.map((point) => ({ x: point.x + shift, y: point.y }));
}

function appendRing(path: Path2D, points: UnwrappedPoint[], shiftX: number) {
  points.forEach((point, index) => {
    const x = point.x + shiftX;
    if (index === 0) path.moveTo(x, point.y);
    else path.lineTo(x, point.y);
  });
  path.closePath();
}

function buildChunks(rings: number[][][]): DetailChunk[] {
  if (rings.length === 0) return [];
  const outer = unwrapRing(rings[0]);
  if (outer.length === 0) return [];
  const outerBounds = boundsFor(outer);
  const outerMidX = (outerBounds.minX + outerBounds.maxX) / 2;
  const alignedRings = [outer, ...rings.slice(1).map((ring) => alignRing(unwrapRing(ring), outerMidX))];

  let minX = Infinity;
  let maxX = -Infinity;
  for (const ring of alignedRings) {
    const bounds = boundsFor(ring);
    minX = Math.min(minX, bounds.minX);
    maxX = Math.max(maxX, bounds.maxX);
  }

  const minShift = Math.floor((-WORLD_MAP_WIDTH - maxX) / WORLD_MAP_WIDTH);
  const maxShift = Math.ceil((2 * WORLD_MAP_WIDTH - minX) / WORLD_MAP_WIDTH);
  const chunks: DetailChunk[] = [];

  for (let shift = minShift; shift <= maxShift; shift += 1) {
    const shiftX = shift * WORLD_MAP_WIDTH;
    const path = new Path2D();
    let chunkMinX = Infinity, chunkMinY = Infinity, chunkMaxX = -Infinity, chunkMaxY = -Infinity;

    for (const ring of alignedRings) {
      appendRing(path, ring, shiftX);
      for (const point of ring) {
        const x = point.x + shiftX;
        chunkMinX = Math.min(chunkMinX, x);
        chunkMinY = Math.min(chunkMinY, point.y);
        chunkMaxX = Math.max(chunkMaxX, x);
        chunkMaxY = Math.max(chunkMaxY, point.y);
      }
    }

    chunks.push({ path, minX: chunkMinX, minY: chunkMinY, maxX: chunkMaxX, maxY: chunkMaxY });
  }
  return chunks;
}

// Projection and Path2D construction happen once when the detail module is
// lazily loaded, never again during a pan/zoom gesture.
const chunks = allPolygons().flatMap(buildChunks);

function intersects(a: WorldBounds, b: WorldBounds) {
  return a.maxX >= b.minX && a.minX <= b.maxX && a.maxY >= b.minY && a.minY <= b.maxY;
}

/** High-detail land layer. Loaded lazily for close zoom levels. */
export function drawDetailedCoastline(
  ctx: CanvasRenderingContext2D,
  screenScale: number,
  visibleBounds: WorldBounds,
) {
  ctx.save();
  ctx.fillStyle = '#7f7253';
  ctx.strokeStyle = 'rgba(224, 211, 170, .72)';
  ctx.lineWidth = 1.15 / Math.max(0.01, screenScale);

  for (const chunk of chunks) {
    if (!intersects(chunk, visibleBounds)) continue;
    ctx.fill(chunk.path, 'evenodd');
    ctx.stroke(chunk.path);
  }
  ctx.restore();
}
