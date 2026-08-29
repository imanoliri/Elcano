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

function cycleStart(time: Date) { return Math.floor(time.getTime() / (18 * DAY)) * 18 * DAY; }

/**
 * A deliberately small, deterministic global weather population. Systems are
 * generated per basin cycle, rather than per mission, so every voyage samples
 * the same living ocean for its current simulation time.
 */
export function globalWeatherSystems(time: Date): WeatherSystem[] {
  const start = cycleStart(time);
  const progressHours = (time.getTime() - start) / HOUR;
  const month = time.getUTCMonth();
  const southernWinter = month >= 4 && month <= 9;
  const northernWinter = month <= 2 || month >= 10;
  const southernCycloneSeason = month >= 10 || month <= 3;
  const northIndianSeason = month === 3 || month === 4 || month === 9 || month === 10 || month === 11;
  const templates = [
    // Atlantic and Pacific mid-latitude storm tracks: west → east all year.
    { id: 'north-atlantic', lat: northernWinter ? 47 : 53, lon: -62, eastPerHour: .28, northPerHour: .035, winter: northernWinter },
    { id: 'south-atlantic', lat: southernWinter ? -51 : -45, lon: -64, eastPerHour: .34, northPerHour: .018, winter: southernWinter },
    { id: 'north-pacific', lat: northernWinter ? 45 : 51, lon: 165, eastPerHour: .31, northPerHour: .02, winter: northernWinter },
    { id: 'north-pacific-east', lat: northernWinter ? 42 : 48, lon: -165, eastPerHour: .27, northPerHour: .025, winter: northernWinter },
    { id: 'southern-ocean-west', lat: southernWinter ? -54 : -48, lon: 35, eastPerHour: .38, northPerHour: .01, winter: southernWinter },
    { id: 'southern-ocean-pacific', lat: southernWinter ? -56 : -50, lon: -145, eastPerHour: .4, northPerHour: .012, winter: southernWinter },
    // Tropical systems: seasonal and generally westward before later recurvature.
    ...(month >= 5 && month <= 10 ? [{ id: 'east-pacific-cyclone', lat: 15, lon: -112, eastPerHour: -.16, northPerHour: .015, winter: false }] : []),
    ...([{ id: 'west-pacific-typhoon', lat: 16, lon: 145, eastPerHour: -.13, northPerHour: .02, winter: false }]),
    ...(southernCycloneSeason ? [
      { id: 'southwest-indian-cyclone', lat: -16, lon: 72, eastPerHour: -.12, northPerHour: -.012, winter: false },
      { id: 'australian-cyclone', lat: -17, lon: 125, eastPerHour: -.12, northPerHour: -.01, winter: false },
      { id: 'south-pacific-cyclone', lat: -17, lon: -172, eastPerHour: -.11, northPerHour: -.01, winter: false },
    ] : []),
    ...(northIndianSeason ? [{ id: 'north-indian-cyclone', lat: 14, lon: 88, eastPerHour: -.08, northPerHour: .012, winter: false }] : []),
  ];
  return templates.map((template, index) => {
    const seed = `${start}:${index}`;
    const jitterLat = (hash(`${seed}:lat`) - .5) * 8;
    const jitterLon = (hash(`${seed}:lon`) - .5) * 18;
    const radiusNm = 210 + hash(`${seed}:radius`) * 170;
    const draw = hash(`${seed}:intensity`);
    const tropical = Math.abs(template.lat) < 30;
    const intensity = draw < (tropical ? .42 : .55) ? 'low' : draw < (tropical ? .8 : .88) ? 'gale' : 'severe';
    const winterBonus = template.winter ? 2 : 0;
    const strengthKn = intensity === 'low'
      ? 10 + winterBonus + hash(`${seed}:strength`) * 8
      : intensity === 'gale'
        ? 18 + winterBonus + hash(`${seed}:strength`) * 12
        : 30 + winterBonus + hash(`${seed}:strength`) * 10;
    return {
      id: `${template.id}-${start}-${index}`,
      kind: 'storm',
      intensity,
      center: {
        lat: template.lat + jitterLat + template.northPerHour * progressHours,
        lon: template.lon + jitterLon + template.eastPerHour * progressHours,
      },
      radiusNm,
      strengthKn,
      rotation: template.lat >= 0 ? 1 : -1,
    };
  });
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
