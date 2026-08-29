import type { GeoPosition } from './coordinates';

export type CurrentCorridor = { name: string; lat: number; lon: number; minZoom: number; contains(position: GeoPosition): boolean };
const between = (value: number, a: number, b: number) => value >= Math.min(a, b) && value <= Math.max(a, b);
/** Named persistent routes annotate existing physical current data. */
export const currentCorridors: CurrentCorridor[] = [
  { name: 'Gulf Stream', lat: 34, lon: -72, minZoom: 5, contains: p => between(p.lon, -80, -45) && between(p.lat, 25, 45) },
  { name: 'Brazil Current', lat: -26, lon: -43, minZoom: 6, contains: p => between(p.lon, -55, -32) && between(p.lat, -38, -15) },
  { name: 'Kuroshio Current', lat: 29, lon: 137, minZoom: 6, contains: p => between(p.lon, 122, 155) && between(p.lat, 18, 42) },
  { name: 'Agulhas Current', lat: -33, lon: 31, minZoom: 6, contains: p => between(p.lon, 18, 42) && between(p.lat, -42, -22) },
  { name: 'East Australian Current', lat: -28, lon: 154, minZoom: 6, contains: p => between(p.lon, 148, 165) && between(p.lat, -42, -18) },
];
