import landTopology from 'world-atlas/land-10m.json';
import { feature } from 'topojson-client';
import { project, type GeoPosition } from './coordinates';

type GeoJsonGeometry = {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][] | number[][][][];
};
type GeoJsonFeature = { geometry: GeoJsonGeometry | null };
type GeoJsonFeatureCollection = { type: 'FeatureCollection'; features: GeoJsonFeature[] };
type LandGeoJson = GeoJsonFeature | GeoJsonFeatureCollection;
export type WorldBounds = { minX: number; minY: number; maxX: number; maxY: number };
type DetailChunk = WorldBounds & { path: Path2D };

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

function buildChunk(rings: number[][][]): DetailChunk {
  const path = new Path2D();
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const coordinates of rings) {
    coordinates.forEach(([lon, lat], index) => {
      const point = project({ lat, lon } satisfies GeoPosition);
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
      if (index === 0) path.moveTo(point.x, point.y);
      else path.lineTo(point.x, point.y);
    });
    path.closePath();
  }

  return { path, minX, minY, maxX, maxY };
}

// Projection and Path2D construction happen once when the detail module is
// lazily loaded, never again during a pan/zoom gesture.
const chunks = allPolygons().map(buildChunk);

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
