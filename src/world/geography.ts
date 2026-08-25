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
