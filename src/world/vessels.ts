import type { ExpeditionSupplies } from '../provisioning';
import type { EncounterChoice, VoyageEncounter } from '../voyage-encounters';
import type { GeoPosition } from './coordinates';

export type WorldVessel = { id: string; kind: 'canoe' | 'portuguese' | 'merchant'; name: string; position: GeoPosition; headingDeg: number };
const DAY = 86_400_000;
const routes = [
  { id: 'portuguese-indian', kind: 'portuguese' as const, name: 'Portuguese carrack', start: { lat: -12, lon: 52 }, end: { lat: -3, lon: 77 } },
  { id: 'portuguese-cape-verde', kind: 'portuguese' as const, name: 'Portuguese patrol', start: { lat: 12, lon: -27 }, end: { lat: 21, lon: -22 } },
  { id: 'pacific-canoes', kind: 'canoe' as const, name: 'Island canoes', start: { lat: 10, lon: 126 }, end: { lat: 13, lon: 132 } },
  { id: 'moluccan-canoes', kind: 'canoe' as const, name: 'Coastal canoes', start: { lat: .5, lon: 126 }, end: { lat: 3, lon: 130 } },
  { id: 'atlantic-merchant', kind: 'merchant' as const, name: 'Atlantic merchant', start: { lat: 34, lon: -18 }, end: { lat: 38, lon: -7 } },
  { id: 'med-merchant', kind: 'merchant' as const, name: 'Mediterranean trader', start: { lat: 35, lon: 22 }, end: { lat: 37, lon: 29 } },
];

export function worldVesselsAt(time: Date): WorldVessel[] {
  const phase = (time.getTime() / DAY / 12) % 2;
  const t = phase <= 1 ? phase : 2 - phase;
  return routes.map((route) => ({ id: route.id, kind: route.kind, name: route.name, position: { lat: route.start.lat + (route.end.lat - route.start.lat) * t, lon: route.start.lon + (route.end.lon - route.start.lon) * t }, headingDeg: Math.atan2(route.end.lon - route.start.lon, route.end.lat - route.start.lat) * 180 / Math.PI }));
}

function distanceNm(a: GeoPosition, b: GeoPosition) { return Math.hypot((a.lat - b.lat) * 60, (a.lon - b.lon) * 60 * Math.max(.2, Math.cos(a.lat * Math.PI / 180))); }
const choice = (id: string, label: string, effect: EncounterChoice['effect'], result: string): EncounterChoice => ({ id, label, effect, result });

export function vesselInteractionDue(missionId: string, ship: GeoPosition, time: Date, fired: ReadonlySet<string>) {
  const vessel = worldVesselsAt(time).find((candidate) => distanceNm(ship, candidate.position) < 35 && !fired.has(`${missionId}:vessel:${candidate.id}`));
  if (!vessel) return null;
  const key = `${missionId}:vessel:${vessel.id}`;
  const choices: EncounterChoice[] = vessel.kind === 'canoe'
    ? [choice('keep-offshore', 'Keep offshore and continue', {}, 'You acknowledge the canoes and leave the coast undisturbed.'), choice('trade', 'Offer gifts and ask for local knowledge', { tradeGoods: -.25 }, 'A cautious exchange brings local knowledge of water and sheltered approaches.')]
    : vessel.kind === 'portuguese'
      ? [choice('evade', 'Alter course and avoid contact', {}, 'You use the open sea to avoid a meeting.'), choice('signal', 'Signal peacefully and exchange news', { tradeGoods: -.2 }, 'A formal exchange costs a gift, but the ships part without incident.')]
      : [choice('pass', 'Maintain distance', {}, 'The vessels pass without delaying either voyage.'), choice('news', 'Exchange news and weather reports', { tradeGoods: -.1 }, 'A small gift buys useful reports of weather and routes.')];
  const encounter: VoyageEncounter = { id: key, kind: 'contact', title: `${vessel.name} nearby`, text: `The ${vessel.name.toLowerCase()} is within hailing distance. Your choice is visible on the chart and has consequences; contact is not automatically hostile.`, choices };
  return { key, encounter };
}
