import type { ExpeditionSupplies } from './provisioning';
import type { GeoPosition } from './world/coordinates';
import { windAt } from './world/environment';

export type EncounterChoice = { id: string; label: string; effect: Partial<Pick<ExpeditionSupplies, 'water' | 'provisions' | 'repairStores' | 'tradeGoods' | 'goldMaravedis' | 'arms'>>; result: string };
export type VoyageEncounter = { id: string; kind: 'seamanship' | 'contact' | 'history'; title: string; text: string; choices: EncounterChoice[] };
type Zone = { id: string; west: number; east: number; south: number; north: number; tags: string[]; intensity: number };

/** Spatial encounter fields are world truth. The UI only receives a fired event. */
export const ENCOUNTER_ZONES: readonly Zone[] = [
  { id: 'north-atlantic', west: -85, east: 15, south: 35, north: 65, tags: ['fog', 'squall', 'merchant'], intensity: .55 },
  { id: 'atlantic-trades', west: -75, east: 15, south: -28, north: 35, tags: ['squall', 'cask', 'merchant'], intensity: .42 },
  { id: 'cape-and-southern-ocean', west: -75, east: 80, south: -62, north: -28, tags: ['gale', 'rigging'], intensity: .72 },
  { id: 'indian-ocean', west: 20, east: 125, south: -35, north: 28, tags: ['squall', 'portuguese', 'merchant'], intensity: .6 },
  { id: 'western-pacific', west: 115, east: 180, south: -25, north: 32, tags: ['squall', 'coastal-contact', 'merchant'], intensity: .58 },
  { id: 'south-pacific', west: -180, east: -75, south: -55, north: 18, tags: ['gale', 'squall', 'cask'], intensity: .48 },
  { id: 'north-pacific', west: -180, east: -105, south: 18, north: 62, tags: ['fog', 'gale', 'merchant'], intensity: .55 },
  { id: 'mediterranean', west: -6, east: 38, south: 30, north: 46, tags: ['coastal-contact', 'squall', 'merchant'], intensity: .42 },
];

function hash(value: string) { let h = 2166136261; for (const char of value) h = Math.imul(h ^ char.charCodeAt(0), 16777619); return (h >>> 0) / 2 ** 32; }
function zoneAt(position: GeoPosition) { return ENCOUNTER_ZONES.find((zone) => position.lon >= zone.west && position.lon <= zone.east && position.lat >= zone.south && position.lat <= zone.north); }

const choices = (id: string, labels: [string, string], effects: [EncounterChoice['effect'], EncounterChoice['effect']], results: [string, string]): EncounterChoice[] => labels.map((label, index) => ({ id: `${id}-${index}`, label, effect: effects[index], result: results[index] }));

function eventFor(tag: string, key: string): VoyageEncounter {
  if (tag === 'fog') return { id: `${key}-fog`, kind: 'seamanship', title: 'Fog closes around the ship', text: 'Visibility collapses and the coast can no longer be trusted at a glance. Sound carefully or keep the voyage moving?', choices: choices('fog', ['Reduce sail and sound', 'Hold course through the fog'], [{}, { repairStores: -.15 }], ['You proceed cautiously and keep the ship clear.', 'The ship rides out a hard bump; a little repair material is needed.']) };
  if (tag === 'gale' || tag === 'squall') return { id: `${key}-squall`, kind: 'seamanship', title: tag === 'gale' ? 'A hard gale rises' : 'A squall line approaches', text: 'The wind is building fast. Your choice is seamanship, not luck.', choices: choices('squall', ['Reef sail and wait for it', 'Carry on under full canvas'], [{}, { repairStores: -.35 }], ['Reefed sails and a patient watch bring the ship through safely.', 'The rigging takes strain; repair stores are used after the squall.']) };
  if (tag === 'cask') return { id: `${key}-cask`, kind: 'seamanship', title: 'A water cask is leaking', text: 'The cooper reports a leak below. Stop to repair it, or accept the loss and keep the weather window?', choices: choices('cask', ['Repair the cask', 'Save time and ration water'], [{ repairStores: -.1 }, { water: -.45 }], ['The cask is saved using a little repair material.', 'Fresh water is lost before the leak can be contained.']) };
  if (tag === 'rigging') return { id: `${key}-rigging`, kind: 'seamanship', title: 'Strain in the rigging', text: 'Heavy southern seas have worked the standing rigging loose.', choices: choices('rigging', ['Heave to and secure it', 'Press on'], [{ repairStores: -.15 }, { repairStores: -.45 }], ['A cautious stop leaves the rig secure.', 'The strain worsens and consumes more repair stores.']) };
  if (tag === 'portuguese') return { id: `${key}-portuguese`, kind: 'contact', title: 'A Portuguese sail on the horizon', text: 'A ship holds a course that may cross yours. Its intent is unclear in waters claimed by Portugal.', choices: choices('portuguese', ['Give it a wide berth', 'Signal peacefully'], [{}, { tradeGoods: -.2 }], ['You alter course and avoid a risky meeting.', 'A formal exchange costs a small gift, but the ships part peacefully.']) };
  if (tag === 'coastal-contact') return { id: `${key}-coast`, kind: 'contact', title: 'Coastal canoes sight the ship', text: 'People from the nearby coast are watching your approach. Contact is not automatically hostile.', choices: choices('coast', ['Keep offshore and continue', 'Offer trade and withdraw'], [{}, { tradeGoods: -.25 }], ['You keep distance and leave the coast undisturbed.', 'Gifts are exchanged at a cautious distance before you continue.']) };
  return { id: `${key}-merchant`, kind: 'contact', title: 'A vessel crosses your route', text: 'Another working vessel appears ahead. It may be a trader, fisher, or patrol.', choices: choices('merchant', ['Maintain distance', 'Exchange news'], [{}, { tradeGoods: -.1 }], ['You pass without committing the expedition.', 'A small gift buys useful news of weather and routes.']) };
}

export function encounterDue(missionId: string, position: GeoPosition, time: Date, elapsedHours: number, fired: ReadonlySet<string>) {
  const period = Math.floor(elapsedHours / 18);
  if (!period || period > 9) return null;
  const zone = zoneAt(position); if (!zone) return null;
  const key = `${missionId}:${zone.id}:${period}`; if (fired.has(key)) return null;
  const wind = Math.hypot(...Object.values(windAt(position, time)));
  const chance = zone.intensity * (wind > 22 ? 1.35 : 1);
  if (hash(key) > chance * .38) return null;
  const tag = zone.tags[Math.floor(hash(`${key}:tag`) * zone.tags.length)] ?? 'merchant';
  return { key, encounter: eventFor(tag, key) };
}

export function historicalDecisionDue(missionId: string, progress: number, fired: ReadonlySet<string>) {
  const key = `${missionId}:decision`;
  if (progress < .48 || fired.has(key)) return null;
  return { key, encounter: { id: key, kind: 'history' as const, title: 'Expedition council', text: 'At this point in the passage, the officers ask whether to preserve stores and caution or press the planned route. This is a gameplay choice; the historical log records its real-world context separately.', choices: choices('council', ['Preserve stores and proceed cautiously', 'Press the planned route'], [{ provisions: -.1 }, { repairStores: -.1 }], ['The council chooses a conservative course and the stores remain protected.', 'The council keeps the expedition moving, accepting additional wear.']) } };
}

export function applyEncounterChoice(supplies: ExpeditionSupplies | undefined, choice: EncounterChoice) {
  if (!supplies) return supplies;
  const next = { ...supplies };
  for (const [key, delta] of Object.entries(choice.effect) as [keyof EncounterChoice['effect'], number][]) next[key] = Math.max(0, (next[key] as number) + delta) as never;
  return next;
}
