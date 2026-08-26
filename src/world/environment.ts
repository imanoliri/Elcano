import type { EastNorthVector, GeoPosition } from './coordinates';
import { createAtlanticClimatologyProvider } from './grid-environment';
import { createGlobalTiledEnvironment, prefetchGlobalEnvironment, type EnvironmentBounds } from './global-environment-tiles';

export type EnvironmentalSample = EastNorthVector;

export interface EnvironmentProvider {
  id: string;
  label: string;
  windAt(position: GeoPosition, time: Date): EnvironmentalSample;
  currentAt(position: GeoPosition, time: Date): EnvironmentalSample;
}

const DEG = Math.PI / 180;

function vectorFromTowardBearing(speed: number, bearingDeg: number): EnvironmentalSample {
  const a = bearingDeg * DEG;
  return { x: Math.sin(a) * speed, y: Math.cos(a) * speed };
}

/**
 * Lightweight analytic approximation retained as an offline fallback and for
 * positions whose remote/global tile has not loaded. It is not historical truth.
 */
export const climatologyEnvironment: EnvironmentProvider = {
  id: 'baked-climatology-v1',
  label: 'Simplified climatology fallback',
  windAt(position, time) {
    const lat = position.lat;
    const monthPhase = (time.getUTCMonth() / 12) * Math.PI * 2;
    const seasonalShift = Math.sin(monthPhase) * 4;
    const effectiveLat = lat - seasonalShift;

    if (effectiveLat > 35) return vectorFromTowardBearing(16, 75);
    if (effectiveLat > 5) return vectorFromTowardBearing(13, 255);
    if (effectiveLat > -5) return vectorFromTowardBearing(7, 265);
    if (effectiveLat > -35) return vectorFromTowardBearing(14, 285);
    return vectorFromTowardBearing(17, 95);
  },
  currentAt(position) {
    const { lat, lon } = position;
    let east = 0;
    let north = 0;
    if (lat > 5 && lat < 35) east -= 0.35;
    if (lat < -5 && lat > -35) east -= 0.3;
    if (lat > 35 && lat < 55) east += 0.45;
    if (lat < -35 && lat > -55) east += 0.5;

    if (lon > -85 && lon < -45 && lat > 15 && lat < 45) north += 0.45;
    if (lon > -25 && lon < 15 && lat > 10 && lat < 35) north -= 0.2;
    if (lon > 25 && lon < 120 && lat < -10 && lat > -40) north += 0.12;

    return { x: east, y: north };
  },
};

export const observedAtlanticEnvironment = createAtlanticClimatologyProvider(climatologyEnvironment);
export const globalObservedEnvironment = createGlobalTiledEnvironment(observedAtlanticEnvironment);
let activeEnvironment: EnvironmentProvider = globalObservedEnvironment;

export function setEnvironmentProvider(provider: EnvironmentProvider) {
  activeEnvironment = provider;
}

export function prefetchEnvironmentBounds(bounds: EnvironmentBounds, time: Date) {
  return prefetchGlobalEnvironment(bounds, time);
}

export function windAt(position: GeoPosition, time: Date) {
  return activeEnvironment.windAt(position, time);
}

export function currentAt(position: GeoPosition, time: Date) {
  return activeEnvironment.currentAt(position, time);
}
