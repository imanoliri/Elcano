import type { EastNorthVector, GeoPosition } from './coordinates';

export type StraitZone = { id: string; name: string; center: GeoPosition; radiusNm: number; axisBearing: number; peakCurrentKn: number; phaseHours: number; windGain: number };
export const straitZones: StraitZone[] = [
  { id: 'narrows', name: 'Atlantic Narrows', center: { lat: -52.42, lon: -69.15 }, radiusNm: 40, axisBearing: 270, peakCurrentKn: 4.5, phaseHours: 0, windGain: 1.25 },
  // Keep a meaningful but usable handover from the Atlantic Narrows: both
  // zones now share a westbound set for roughly 4.7 hours each tide cycle.
  { id: 'central', name: 'Central channels', center: { lat: -53.05, lon: -71.15 }, radiusNm: 58, axisBearing: 286, peakCurrentKn: 3.2, phaseHours: 1.5, windGain: 1.15 },
  // West of Bahía Fortescue the channel turns westward again. Without this
  // separate reach, the global background current remains visible here and
  // can make the passage permanently eastbound.
  { id: 'fortescue-west', name: 'Fortescue western channel', center: { lat: -53.62, lon: -72.85 }, radiusNm: 56, axisBearing: 270, peakCurrentKn: 3.4, phaseHours: 5.25, windGain: 1.18 },
  { id: 'pacific', name: 'Pacific exit', center: { lat: -52.74, lon: -73.75 }, radiusNm: 50, axisBearing: 270, peakCurrentKn: 2.6, phaseHours: 7, windGain: 1.35 },
];

export const straitAnchorages = [
  { name: 'Bahía Posesión', position: { lat: -52.42, lon: -69.05 } },
  { name: 'Puerto del Hambre', position: { lat: -53.62, lon: -70.92 } },
  { name: 'Bahía Fortescue', position: { lat: -53.70, lon: -72.35 } },
] as const;

const HOUR = 3_600_000;
const TIDE_HOURS = 12.42;

function distanceNm(a: GeoPosition, b: GeoPosition) {
  const north = (a.lat - b.lat) * 60;
  const east = (a.lon - b.lon) * 60 * Math.max(.2, Math.cos(a.lat * Math.PI / 180));
  return Math.hypot(east, north);
}

function vector(bearing: number, speed: number): EastNorthVector {
  const angle = bearing * Math.PI / 180;
  return { x: Math.sin(angle) * speed, y: Math.cos(angle) * speed };
}

export function straitZoneAt(position: GeoPosition) {
  return straitZones.map((zone) => ({ zone, distance: distanceNm(position, zone.center) })).filter(({ zone, distance }) => distance <= zone.radiusNm).sort((a, b) => a.distance - b.distance)[0]?.zone ?? null;
}

export function straitLocalEffects(position: GeoPosition, time: Date) {
  const zone = straitZoneAt(position);
  if (!zone) return { wind: { x: 0, y: 0 }, current: { x: 0, y: 0 }, zone: null };
  const hours = time.getTime() / HOUR + zone.phaseHours;
  const tide = Math.sin(hours / TIDE_HOURS * Math.PI * 2);
  const current = vector(zone.axisBearing, tide * zone.peakCurrentKn);
  return { wind: { x: 0, y: 0 }, current, zone };
}

export function straitWindModifier(position: GeoPosition, wind: EastNorthVector) {
  const zone = straitZoneAt(position);
  if (!zone) return wind;
  const along = vector(zone.axisBearing, 1);
  const projected = wind.x * along.x + wind.y * along.y;
  return { x: wind.x + along.x * projected * (zone.windGain - 1), y: wind.y + along.y * projected * (zone.windGain - 1) };
}

export function straitTideDescription(position: GeoPosition, time: Date) {
  const zone = straitZoneAt(position);
  if (!zone) return null;
  const current = straitLocalEffects(position, time).current;
  const speed = Math.hypot(current.x, current.y);
  const towardWest = current.x < 0;
  const phase = speed < .45 ? 'Slack water' : `${towardWest ? 'Westbound' : 'Eastbound'} tide ${speed > zone.peakCurrentKn * .78 ? 'strong' : 'building'}`;
  return { zone, phase, speed, favourableInHours: towardWest ? 0 : Math.round(TIDE_HOURS / 2) };
}
