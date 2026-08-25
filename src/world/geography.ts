import landTopology from 'world-atlas/land-50m.json';
import { feature } from 'topojson-client';
import { project, type GeoPosition } from './coordinates';

type GeoJsonGeometry = {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][] | number[][][][];
};

type GeoJsonFeature = { geometry: GeoJsonGeometry | null };
type GeoJsonFeatureCollection = { type: 'FeatureCollection'; features: GeoJsonFeature[] };

type LandGeoJson = GeoJsonFeature | GeoJsonFeatureCollection;

const land = feature(
  landTopology as never,
  (landTopology as { objects: { land: unknown } }).objects.land as never,
) as unknown as LandGeoJson;

function ring(ctx: CanvasRenderingContext2D, coordinates: number[][]) {
  coordinates.forEach(([lon, lat], index) => {
    const point = project({ lat, lon } satisfies GeoPosition);
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.closePath();
}

function geometry(ctx: CanvasRenderingContext2D, value: GeoJsonGeometry | null) {
  if (!value) return;

  if (value.type === 'Polygon') {
    for (const polygonRing of value.coordinates as number[][][]) ring(ctx, polygonRing);
    return;
  }

  for (const polygon of value.coordinates as number[][][][]) {
    for (const polygonRing of polygon) ring(ctx, polygonRing);
  }
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

function geometryContains(position: GeoPosition, value: GeoJsonGeometry | null) {
  if (!value) return false;

  if (value.type === 'Polygon') {
    return pointInPolygon(position, value.coordinates as number[][][]);
  }

  return (value.coordinates as number[][][][]).some((polygon) => pointInPolygon(position, polygon));
}

export function isLand(position: GeoPosition) {
  if ('features' in land) {
    return land.features.some((item) => geometryContains(position, item.geometry));
  }
  return geometryContains(position, land.geometry);
}

export function drawLand(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.beginPath();

  if ('features' in land) {
    for (const item of land.features) geometry(ctx, item.geometry);
  } else {
    geometry(ctx, land.geometry);
  }

  ctx.fillStyle = '#7f7253';
  ctx.strokeStyle = 'rgba(224, 211, 170, .62)';
  ctx.lineWidth = 0.9;
  ctx.fill('evenodd');
  ctx.stroke();
  ctx.restore();
}
