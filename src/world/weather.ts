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
 * A deliberately small, deterministic Atlantic weather population. Systems are
 * generated per basin cycle, rather than per mission, so every voyage samples
 * the same living ocean for its current simulation time.
 */
export function atlanticWeatherSystems(time: Date): WeatherSystem[] {
  const start = cycleStart(time);
  const progressHours = (time.getTime() - start) / HOUR;
  const month = time.getUTCMonth();
  const southernWinter = month >= 4 && month <= 9;
  const northernWinter = month <= 2 || month >= 10;
  const templates = [
    { band: 'north', lat: northernWinter ? 47 : 53, lon: -62, eastPerHour: 0.28, northPerHour: 0.035, winter: northernWinter },
    { band: 'south', lat: southernWinter ? -51 : -45, lon: -64, eastPerHour: 0.34, northPerHour: 0.018, winter: southernWinter },
    { band: 'south', lat: southernWinter ? -39 : -35, lon: -28, eastPerHour: 0.22, northPerHour: -0.025, winter: southernWinter },
  ];
  return templates.map((template, index) => {
    const seed = `${start}:${index}`;
    const jitterLat = (hash(`${seed}:lat`) - .5) * 8;
    const jitterLon = (hash(`${seed}:lon`) - .5) * 18;
    const radiusNm = 210 + hash(`${seed}:radius`) * 170;
    const draw = hash(`${seed}:intensity`);
    const intensity = draw < .55 ? 'low' : draw < .88 ? 'gale' : 'severe';
    const winterBonus = template.winter ? 2 : 0;
    const strengthKn = intensity === 'low'
      ? 10 + winterBonus + hash(`${seed}:strength`) * 8
      : intensity === 'gale'
        ? 18 + winterBonus + hash(`${seed}:strength`) * 12
        : 30 + winterBonus + hash(`${seed}:strength`) * 10;
    return {
      id: `atlantic-storm-${start}-${index}`,
      kind: 'storm',
      intensity,
      center: {
        lat: template.lat + jitterLat + template.northPerHour * progressHours,
        lon: template.lon + jitterLon + template.eastPerHour * progressHours,
      },
      radiusNm,
      strengthKn,
      rotation: template.band === 'north' ? 1 : -1,
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
  return atlanticWeatherSystems(time).reduce((total, system) => {
    const wind = influence(system, position);
    return { x: total.x + wind.x, y: total.y + wind.y };
  }, { x: 0, y: 0 });
}

export function weatherCurrentInfluenceAt(position: GeoPosition, time: Date): EastNorthVector {
  const wind = weatherWindInfluenceAt(position, time);
  return { x: wind.x * .008, y: wind.y * .008 };
}
