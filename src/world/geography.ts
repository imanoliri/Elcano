import landTopology from 'world-atlas/land-50m.json';
import { feature } from 'topojson-client';
import { project, type GeoPosition } from './coordinates';

type GeoJsonGeometry = {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][] | number[][][][];
};

type GeoJsonFeature = { geometry: GeoJsonGeometry };

const land = feature(
  landTopology as never,
  (landTopology as { objects: { land: unknown } }).objects.land as never,
) as unknown as GeoJsonFeature;

function ring(ctx: CanvasRenderingContext2D, coordinates: number[][]) {
  coordinates.forEach(([lon, lat], index) => {
    const point = project({ lat, lon } satisfies GeoPosition);
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.closePath();
}

export function drawLand(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.beginPath();

  if (land.geometry.type === 'Polygon') {
    for (const polygonRing of land.geometry.coordinates as number[][][]) ring(ctx, polygonRing);
  } else {
    for (const polygon of land.geometry.coordinates as number[][][][]) {
      for (const polygonRing of polygon) ring(ctx, polygonRing);
    }
  }

  ctx.fillStyle = '#7f7253';
  ctx.strokeStyle = 'rgba(224, 211, 170, .62)';
  ctx.lineWidth = 0.9;
  ctx.fill('evenodd');
  ctx.stroke();
  ctx.restore();
}
