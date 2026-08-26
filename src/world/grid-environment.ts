import type { EastNorthVector, GeoPosition } from './coordinates';
import { ATLANTIC_CLIMATOLOGY } from './data/atlantic-climatology.generated';
import type { EnvironmentProvider } from './environment';

type PackedGrid = {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
  stepDeg: number;
  latCount: number;
  lonCount: number;
  months: number;
  components: number;
  scale: number;
  missing: number;
  packed: string;
};

const decoded = new WeakMap<object, Int16Array>();

function decodePacked(grid: PackedGrid) {
  if (!grid.packed) return null;
  const cached = decoded.get(grid as object);
  if (cached) return cached;
  const binary = atob(grid.packed);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const values = new Int16Array(bytes.buffer);
  decoded.set(grid as object, values);
  return values;
}

function sampleComponent(grid: PackedGrid, position: GeoPosition, month: number, component: number): number | null {
  if (component >= grid.components) return null;
  const data = decodePacked(grid);
  if (!data) return null;
  if (position.lat < grid.minLat || position.lat > grid.maxLat || position.lon < grid.minLon || position.lon > grid.maxLon) return null;

  const latFloat = (position.lat - grid.minLat) / grid.stepDeg;
  const lonFloat = (position.lon - grid.minLon) / grid.stepDeg;
  const lat0 = Math.max(0, Math.min(grid.latCount - 1, Math.floor(latFloat)));
  const lon0 = Math.max(0, Math.min(grid.lonCount - 1, Math.floor(lonFloat)));
  const lat1 = Math.min(grid.latCount - 1, lat0 + 1);
  const lon1 = Math.min(grid.lonCount - 1, lon0 + 1);
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
    const index = (((month * grid.latCount + latIndex) * grid.lonCount + lonIndex) * grid.components) + component;
    const raw = data[index];
    if (raw === grid.missing) continue;
    weighted += (raw / grid.scale) * weight;
    totalWeight += weight;
  }
  return totalWeight > 0 ? weighted / totalWeight : null;
}

function vectorAt(grid: PackedGrid, position: GeoPosition, time: Date): EastNorthVector | null {
  const month = time.getUTCMonth();
  const x = sampleComponent(grid, position, month, 0);
  const y = sampleComponent(grid, position, month, 1);
  return x === null || y === null ? null : { x, y };
}

function windVectorAt(grid: PackedGrid, position: GeoPosition, time: Date): EastNorthVector | null {
  const month = time.getUTCMonth();
  const x = sampleComponent(grid, position, month, 0);
  const y = sampleComponent(grid, position, month, 1);
  if (x === null || y === null) return null;

  // New generated grids store CCMP mean scalar wind speed as component 2.
  // Use mean u/v only for prevailing direction; using hypot(mean u, mean v)
  // as the speed artificially weakens climatology when directions vary.
  const scalarSpeed = sampleComponent(grid, position, month, 2);
  if (scalarSpeed === null) return { x, y }; // backward compatibility

  const directionMagnitude = Math.hypot(x, y);
  if (directionMagnitude < 0.05 || scalarSpeed <= 0) return { x, y };
  return {
    x: x / directionMagnitude * scalarSpeed,
    y: y / directionMagnitude * scalarSpeed,
  };
}

export function hasPackedAtlanticClimatology() {
  return Boolean(ATLANTIC_CLIMATOLOGY.wind.packed || ATLANTIC_CLIMATOLOGY.current.packed);
}

export function createAtlanticClimatologyProvider(fallback: EnvironmentProvider): EnvironmentProvider {
  return {
    id: 'regional-observed-environment-v3',
    label: 'Regional observed environment',
    windAt(position, time) {
      return windVectorAt(ATLANTIC_CLIMATOLOGY.wind, position, time) ?? fallback.windAt(position, time);
    },
    currentAt(position, time) {
      return vectorAt(ATLANTIC_CLIMATOLOGY.current, position, time) ?? fallback.currentAt(position, time);
    },
  };
}
