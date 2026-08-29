import type { EastNorthVector, GeoPosition } from './coordinates';

export type WeatherSystem = {
  id: string;
  kind: 'storm';
  intensity: 'low' | 'gale' | 'severe';
  center: GeoPosition;
  radiusNm: number;
  strengthKn: number;
  /** Counter-clockwise in the northern hemisphere, clockwise in the southern. */
  rotation: 1 | -1;
};

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
function hash(value: string) {
  let state = 2166136261;
  for (const character of value) { state ^= character.charCodeAt(0); state = Math.imul(state, 16777619); }
  return (state >>> 0) / 2 ** 32;
}

type StormTemplate = {
  id: string;
  lat: number;
  lon: number;
  eastPerHour: number;
  northPerHour: number;
  lifetimeDays: number;
  intervalDays: number;
  radiusMinNm: number;
  radiusRangeNm: number;
  lowThreshold: number;
  galeThreshold: number;
  strengthScale: number;
};

function stormFromTemplate(template: StormTemplate, start: number, progressHours: number, lifecycle = 1): WeatherSystem {
  const seed = `${template.id}:${start}`;
  const jitterLat = (hash(`${seed}:lat`) - .5) * 8;
  const jitterLon = (hash(`${seed}:lon`) - .5) * 18;
  const radiusNm = template.radiusMinNm + hash(`${seed}:radius`) * template.radiusRangeNm;
  const draw = hash(`${seed}:intensity`);
  const intensity = draw < template.lowThreshold ? 'low' : draw < template.galeThreshold ? 'gale' : 'severe';
  const baseStrengthKn = intensity === 'low'
    ? 10 + hash(`${seed}:strength`) * 8
    : intensity === 'gale'
      ? 18 + hash(`${seed}:strength`) * 12
      : 30 + hash(`${seed}:strength`) * 10;
  return {
    id: `${template.id}-${start}`,
    kind: 'storm',
    intensity,
    center: {
      lat: template.lat + jitterLat + template.northPerHour * progressHours,
      lon: template.lon + jitterLon + template.eastPerHour * progressHours,
    },
    radiusNm,
    strengthKn: baseStrengthKn * template.strengthScale * lifecycle,
    rotation: template.lat >= 0 ? 1 : -1,
  };
}

/**
 * Each basin profile is a deterministic procession rather than one object that
 * teleports back to its starting point. Counts, lifetime, size, and intensity
 * are all profile-specific.
 */
function stormTrackSystems(template: StormTemplate, time: Date): WeatherSystem[] {
  const interval = template.intervalDays * DAY;
  const lifetime = template.lifetimeDays * DAY;
  const latestStart = Math.floor(time.getTime() / interval) * interval;
  const storms: WeatherSystem[] = [];
  for (let start = latestStart; start > latestStart - lifetime; start -= interval) {
    const age = time.getTime() - start;
    if (age < 0 || age >= lifetime) continue;
    const progress = age / lifetime;
    // Zero at formation and dissipation, strongest halfway through life.
    const lifecycle = Math.sin(Math.PI * progress);
    storms.push(stormFromTemplate(template, start, age / HOUR, lifecycle));
  }
  return storms;
}

/**
 * A deliberately small, deterministic global weather population. Systems are
 * generated per basin cycle, rather than per mission, so every voyage samples
 * the same living ocean for its current simulation time.
 */
export function globalWeatherSystems(time: Date): WeatherSystem[] {
  const month = time.getUTCMonth();
  const southernWinter = month >= 4 && month <= 9;
  const northernWinter = month <= 2 || month >= 10;
  const southernCycloneSeason = month >= 10 || month <= 3;
  const northIndianSeason = month === 3 || month === 4 || month === 9 || month === 10 || month === 11;
  const tropicalPeak = month >= 7 && month <= 9;
  const southernTropicalPeak = month >= 0 && month <= 2;
  const northIndianPeak = month === 4 || month === 9 || month === 10;
  const templates = [
    // North Atlantic: sparse, weak and poleward in summer; a stronger, denser winter track.
    northernWinter
      ? { id: 'north-atlantic', lat: 47, lon: -70, eastPerHour: .22, northPerHour: .025, lifetimeDays: 8, intervalDays: 3, radiusMinNm: 280, radiusRangeNm: 220, lowThreshold: .42, galeThreshold: .84, strengthScale: 1.08 }
      : { id: 'north-atlantic', lat: 54, lon: -58, eastPerHour: .16, northPerHour: .012, lifetimeDays: 5, intervalDays: 5, radiusMinNm: 220, radiusRangeNm: 150, lowThreshold: .76, galeThreshold: .97, strengthScale: .72 },
    // South Atlantic: a broader and more vigorous austral-winter westerly track.
    southernWinter
      ? { id: 'south-atlantic', lat: -51, lon: -64, eastPerHour: .30, northPerHour: .01, lifetimeDays: 9, intervalDays: 3, radiusMinNm: 300, radiusRangeNm: 240, lowThreshold: .36, galeThreshold: .77, strengthScale: 1.12 }
      : { id: 'south-atlantic', lat: -45, lon: -64, eastPerHour: .22, northPerHour: .012, lifetimeDays: 7, intervalDays: 5, radiusMinNm: 260, radiusRangeNm: 190, lowThreshold: .62, galeThreshold: .92, strengthScale: .86 },
    // North Pacific: a primary western storm track plus a weaker eastern branch.
    northernWinter
      ? { id: 'north-pacific-west', lat: 45, lon: 165, eastPerHour: .29, northPerHour: .018, lifetimeDays: 8, intervalDays: 3, radiusMinNm: 300, radiusRangeNm: 240, lowThreshold: .38, galeThreshold: .80, strengthScale: 1.1 }
      : { id: 'north-pacific-west', lat: 51, lon: 165, eastPerHour: .19, northPerHour: .012, lifetimeDays: 6, intervalDays: 6, radiusMinNm: 240, radiusRangeNm: 180, lowThreshold: .68, galeThreshold: .94, strengthScale: .8 },
    northernWinter
      ? { id: 'north-pacific-east', lat: 42, lon: -165, eastPerHour: .23, northPerHour: .022, lifetimeDays: 6, intervalDays: 6, radiusMinNm: 260, radiusRangeNm: 190, lowThreshold: .54, galeThreshold: .88, strengthScale: .96 }
      : { id: 'north-pacific-east', lat: 48, lon: -165, eastPerHour: .17, northPerHour: .018, lifetimeDays: 5, intervalDays: 5, radiusMinNm: 210, radiusRangeNm: 150, lowThreshold: .78, galeThreshold: .98, strengthScale: .7 },
    // Southern Ocean: the world's most persistent, fastest and largest storm belt.
    southernWinter
      ? { id: 'southern-ocean-west', lat: -54, lon: 35, eastPerHour: .38, northPerHour: .01, lifetimeDays: 10, intervalDays: 3, radiusMinNm: 360, radiusRangeNm: 280, lowThreshold: .28, galeThreshold: .70, strengthScale: 1.2 }
      : { id: 'southern-ocean-west', lat: -48, lon: 35, eastPerHour: .32, northPerHour: .01, lifetimeDays: 8, intervalDays: 4, radiusMinNm: 320, radiusRangeNm: 230, lowThreshold: .46, galeThreshold: .82, strengthScale: 1.02 },
    southernWinter
      ? { id: 'southern-ocean-pacific', lat: -56, lon: -145, eastPerHour: .40, northPerHour: .012, lifetimeDays: 10, intervalDays: 3, radiusMinNm: 360, radiusRangeNm: 280, lowThreshold: .28, galeThreshold: .70, strengthScale: 1.2 }
      : { id: 'southern-ocean-pacific', lat: -50, lon: -145, eastPerHour: .34, northPerHour: .012, lifetimeDays: 8, intervalDays: 4, radiusMinNm: 320, radiusRangeNm: 230, lowThreshold: .46, galeThreshold: .82, strengthScale: 1.02 },
    // Tropical systems: compact, stronger at the seasonal peak, and generally westward before recurvature is modelled.
    ...(month >= 5 && month <= 10 ? [{ id: 'east-pacific-cyclone', lat: 15, lon: -112, eastPerHour: -.15, northPerHour: .018, lifetimeDays: tropicalPeak ? 8 : 6, intervalDays: tropicalPeak ? 5 : 6, radiusMinNm: 130, radiusRangeNm: 150, lowThreshold: tropicalPeak ? .30 : .58, galeThreshold: tropicalPeak ? .72 : .90, strengthScale: tropicalPeak ? 1.12 : .82 }] : []),
    ...([{ id: 'west-pacific-typhoon', lat: 16, lon: 145, eastPerHour: -.13, northPerHour: .025, lifetimeDays: tropicalPeak ? 9 : 7, intervalDays: tropicalPeak ? 5 : 7, radiusMinNm: 140, radiusRangeNm: 170, lowThreshold: tropicalPeak ? .24 : .48, galeThreshold: tropicalPeak ? .68 : .86, strengthScale: tropicalPeak ? 1.18 : .96 }]),
    ...(southernCycloneSeason ? [
      { id: 'southwest-indian-cyclone', lat: -16, lon: 72, eastPerHour: -.12, northPerHour: -.014, lifetimeDays: southernTropicalPeak ? 8 : 6, intervalDays: southernTropicalPeak ? 5 : 6, radiusMinNm: 130, radiusRangeNm: 150, lowThreshold: southernTropicalPeak ? .30 : .58, galeThreshold: southernTropicalPeak ? .72 : .90, strengthScale: southernTropicalPeak ? 1.1 : .82 },
      { id: 'australian-cyclone', lat: -17, lon: 125, eastPerHour: -.11, northPerHour: -.012, lifetimeDays: southernTropicalPeak ? 8 : 6, intervalDays: southernTropicalPeak ? 5 : 6, radiusMinNm: 130, radiusRangeNm: 150, lowThreshold: southernTropicalPeak ? .32 : .60, galeThreshold: southernTropicalPeak ? .74 : .91, strengthScale: southernTropicalPeak ? 1.08 : .8 },
      { id: 'south-pacific-cyclone', lat: -17, lon: -172, eastPerHour: -.10, northPerHour: -.012, lifetimeDays: southernTropicalPeak ? 8 : 6, intervalDays: southernTropicalPeak ? 5 : 6, radiusMinNm: 130, radiusRangeNm: 150, lowThreshold: southernTropicalPeak ? .34 : .62, galeThreshold: southernTropicalPeak ? .76 : .92, strengthScale: southernTropicalPeak ? 1.05 : .78 },
    ] : []),
    ...(northIndianSeason ? [{ id: 'north-indian-cyclone', lat: 14, lon: 88, eastPerHour: -.08, northPerHour: .014, lifetimeDays: northIndianPeak ? 8 : 6, intervalDays: northIndianPeak ? 5 : 6, radiusMinNm: 120, radiusRangeNm: 140, lowThreshold: northIndianPeak ? .32 : .60, galeThreshold: northIndianPeak ? .74 : .91, strengthScale: northIndianPeak ? 1.08 : .8 }] : []),
  ];
  return templates.flatMap((template) => stormTrackSystems(template, time));
}

function influence(system: WeatherSystem, position: GeoPosition): EastNorthVector {
  const north = (position.lat - system.center.lat) * 60;
  const east = (position.lon - system.center.lon) * 60 * Math.max(.2, Math.cos(position.lat * Math.PI / 180));
  const distance = Math.hypot(east, north);
  if (distance >= system.radiusNm || distance < 0.001) return { x: 0, y: 0 };
  const normalizedDistance = distance / system.radiusNm;
  // Calm at the low's centre; wind builds gradually to a broad peak ring at
  // 70% of the radius, then drops quickly at the system's outer boundary.
  const falloff = normalizedDistance <= .7
    ? normalizedDistance / .7
    : (1 - normalizedDistance) / .3;
  const tangentEast = -north / distance * system.rotation;
  const tangentNorth = east / distance * system.rotation;
  return { x: tangentEast * system.strengthKn * falloff, y: tangentNorth * system.strengthKn * falloff };
}

export function weatherWindInfluenceAt(position: GeoPosition, time: Date): EastNorthVector {
  return globalWeatherSystems(time).reduce((total, system) => {
    const wind = influence(system, position);
    return { x: total.x + wind.x, y: total.y + wind.y };
  }, { x: 0, y: 0 });
}

export function weatherCurrentInfluenceAt(position: GeoPosition, time: Date): EastNorthVector {
  const wind = weatherWindInfluenceAt(position, time);
  return { x: wind.x * .008, y: wind.y * .008 };
}
