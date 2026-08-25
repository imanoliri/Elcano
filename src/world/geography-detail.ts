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

/** High-detail coastline only. Loaded lazily for close zoom levels. */
export function drawDetailedCoastline(ctx: CanvasRenderingContext2D, screenScale: number) {
  ctx.save();
  ctx.beginPath();
  if ('features' in land) {
    for (const item of land.features) geometry(ctx, item.geometry);
  } else {
    geometry(ctx, land.geometry);
  }

  // A land-colored under-stroke hides jagged pixels from the low-resolution
  // base canvas, then a thin coastline stroke restores the chart outline.
  ctx.strokeStyle = '#7f7253';
  ctx.lineWidth = 3.2 / Math.max(0.01, screenScale);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(224, 211, 170, .72)';
  ctx.lineWidth = 1.15 / Math.max(0.01, screenScale);
  ctx.stroke();
  ctx.restore();
}
