import type { EastNorthVector, GeoPosition } from './coordinates';
import { ATLANTIC_CLIMATOLOGY } from './data/atlantic-climatology.generated';
import type { EnvironmentProvider } from './environment';

const COMPONENTS = 4;
const WIND_E = 0;
const WIND_N = 1;
const CURRENT_E = 2;
const CURRENT_N = 3;

let decoded: Int16Array | null | undefined;

function decodePacked() {
  if (decoded !== undefined) return decoded;
  if (!ATLANTIC_CLIMATOLOGY.packed) {
    decoded = null;
    return decoded;
  }

  const binary = atob(ATLANTIC_CLIMATOLOGY.packed);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  decoded = new Int16Array(bytes.buffer);
  return decoded;
}

function sampleComponent(position: GeoPosition, month: number, component: number): number | null {
  const data = decodePacked();
  if (!data) return null;

  const { minLat, maxLat, minLon, maxLon, stepDeg, latCount, lonCount, scale, missing } = ATLANTIC_CLIMATOLOGY;
  if (position.lat < minLat || position.lat > maxLat || position.lon < minLon || position.lon > maxLon) return null;

  const latFloat = (position.lat - minLat) / stepDeg;
  const lonFloat = (position.lon - minLon) / stepDeg;
  const lat0 = Math.max(0, Math.min(latCount - 1, Math.floor(latFloat)));
  const lon0 = Math.max(0, Math.min(lonCount - 1, Math.floor(lonFloat)));
  const lat1 = Math.min(latCount - 1, lat0 + 1);
  const lon1 = Math.min(lonCount - 1, lon0 + 1);
  const fy = Math.max(0, Math.min(1, latFloat - lat0));
  const fx = Math.max(0, Math.min(1, lonFloat - lon0));

  const points = [
    [lat0, lon0, (1 - fx) * (1 - fy)],
    [lat0, lon1, fx * (1 - fy)],
    [lat1, lon0, (1 - fx) * fy],
    [lat1, lon1, fx * fy],
  ] as const;

  let weighted = 0;
  let totalWeight = 0;
  for (const [latIndex, lonIndex, weight] of points) {
    if (weight <= 0) continue;
    const index = (((month * latCount + latIndex) * lonCount + lonIndex) * COMPONENTS) + component;
    const raw = data[index];
    if (raw === missing) continue;
    weighted += (raw / scale) * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weighted / totalWeight : null;
}

function vectorAt(position: GeoPosition, time: Date, eastComponent: number, northComponent: number): EastNorthVector | null {
  const month = time.getUTCMonth();
  const x = sampleComponent(position, month, eastComponent);
  const y = sampleComponent(position, month, northComponent);
  return x === null || y === null ? null : { x, y };
}

export function hasPackedAtlanticClimatology() {
  return Boolean(ATLANTIC_CLIMATOLOGY.packed);
}

export function createAtlanticClimatologyProvider(fallback: EnvironmentProvider): EnvironmentProvider {
  return {
    id: 'atlantic-observed-climatology-v1',
    label: 'Observed Atlantic climatology',
    windAt(position, time) {
      return vectorAt(position, time, WIND_E, WIND_N) ?? fallback.windAt(position, time);
    },
    currentAt(position, time) {
      return vectorAt(position, time, CURRENT_E, CURRENT_N) ?? fallback.currentAt(position, time);
    },
  };
}
