import type { EastNorthVector, GeoPosition } from './coordinates';

export type StraitZone = { id: string; name: string; center: GeoPosition; radiusNm: number; axisBearing: number; minCurrentKn: number; maxCurrentKn: number; phaseHours: number; gusty?: boolean };
export const straitZones: StraitZone[] = [
  { id: 'primera', name: 'Primera Angostura', center: { lat: -52.48, lon: -69.28 }, radiusNm: 28, axisBearing: 270, minCurrentKn: 2, maxCurrentKn: 8, phaseHours: 0 },
  { id: 'segunda', name: 'Segunda Angostura', center: { lat: -52.71, lon: -70.18 }, radiusNm: 34, axisBearing: 278, minCurrentKn: 1.5, maxCurrentKn: 6, phaseHours: 1.2 },
  { id: 'tortuoso', name: 'Paso Tortuoso', center: { lat: -53.27, lon: -72.85 }, radiusNm: 24, axisBearing: 135, minCurrentKn: 1, maxCurrentKn: 3.5, phaseHours: 4.4, gusty: true },
];
export const straitAnchorages = [{ name: 'Bahía Posesión', position: { lat: -52.38, lon: -68.98 } }, { name: 'Puerto del Hambre', position: { lat: -53.62, lon: -70.92 } }, { name: 'Bahía Fortescue', position: { lat: -53.70, lon: -72.35 } }] as const;
const HOUR = 3_600_000, TIDE_HOURS = 12.42, SPRING_NEAP_HOURS = 14.77 * 24;
function vector(bearing: number, speed: number): EastNorthVector { const a = bearing * Math.PI / 180; return { x: Math.sin(a) * speed, y: Math.cos(a) * speed }; }
function magnitude(vector: EastNorthVector) { return Math.hypot(vector.x, vector.y); }
function distanceNm(a: GeoPosition, b: GeoPosition) { const north = (a.lat - b.lat) * 60; const east = (a.lon - b.lon) * 60 * Math.max(.2, Math.cos(a.lat * Math.PI / 180)); return Math.hypot(east, north); }
export function inMagellanStrait(position: GeoPosition) { return position.lat > -54.1 && position.lat < -52.05 && position.lon > -75.1 && position.lon < -68.0; }
export function straitZoneAt(position: GeoPosition) { return straitZones.map((zone) => ({ zone, distance: distanceNm(position, zone.center) })).filter(({ zone, distance }) => distance <= zone.radiusNm).sort((a, b) => a.distance - b.distance)[0]?.zone ?? null; }
export function straitCurrentAt(position: GeoPosition, time: Date) {
  if (!inMagellanStrait(position)) return { x: 0, y: 0 };
  const zone = straitZoneAt(position); if (!zone) return position.lon < -74.2 ? vector(135, .75) : { x: 0, y: 0 };
  const hours = time.getTime() / HOUR, spring = .5 + .5 * Math.sin(hours / SPRING_NEAP_HOURS * Math.PI * 2), peak = zone.minCurrentKn + (zone.maxCurrentKn - zone.minCurrentKn) * spring;
  return vector(zone.axisBearing, Math.sin((hours + zone.phaseHours) / TIDE_HOURS * Math.PI * 2) * peak);
}
export function straitWindAt(position: GeoPosition, time: Date, globalWind: EastNorthVector) {
  if (!inMagellanStrait(position)) return globalWind;
  const zone = straitZoneAt(position), bearing = zone?.id === 'tortuoso' ? 135 : position.lon < -72 ? 120 : 102, baseline = vector(bearing, Math.max(11, magnitude(globalWind) * .78));
  const mixed = { x: baseline.x * .65 + globalWind.x * .35, y: baseline.y * .65 + globalWind.y * .35 };
  if (!zone?.gusty) return mixed;
  const gust = 5 + Math.max(0, Math.sin(time.getTime() / HOUR / 3.7 * Math.PI * 2)) * 9;
  return { x: mixed.x + vector(135, gust).x, y: mixed.y + vector(135, gust).y };
}
export function straitPassageCondition(position: GeoPosition, time: Date, globalWind: EastNorthVector) { const zone = straitZoneAt(position), current = straitCurrentAt(position, time), speed = magnitude(current), westbound = current.x < 0; return { zone, speed, wind: straitWindAt(position, time, globalWind), gusty: Boolean(zone?.gusty), phase: speed < .45 ? 'Slack water' : `${westbound ? 'Westbound' : 'Eastbound'} set ${speed > 3 ? 'strong' : 'building'}` }; }
