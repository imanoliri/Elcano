import {
  greatCircleDistanceNm,
  offsetByNauticalMiles,
  type EastNorthVector,
  type GeoPosition,
} from './world/coordinates';
import { currentAt, windAt } from './world/environment';

export type Vec2 = EastNorthVector;

export type ShipState = {
  position: GeoPosition;
  headingDeg: number;
  speed: number;
};

export type WorldState = {
  time: Date;
  elapsedHours: number;
  ship: ShipState;
  destination: GeoPosition;
};

const DEG = Math.PI / 180;

/**
 * Internal environmental vectors use east/north components in knots and point
 * toward the direction the air/water is travelling.
 */
export { windAt, currentAt };

export function sailingVelocity(headingDeg: number, wind: Vec2, sailTrim = 1): Vec2 {
  const heading = headingDeg * DEG;
  const hx = Math.sin(heading); // east; nautical 0° is north
  const hy = Math.cos(heading); // north

  const windSpeed = Math.hypot(wind.x, wind.y);
  if (windSpeed < 0.0001) return { x: 0, y: 0 };
  const wx = wind.x / windSpeed;
  const wy = wind.y / windSpeed;

  const dot = Math.max(-1, Math.min(1, hx * wx + hy * wy));
  const relative = Math.acos(dot);

  // Simple polar approximation retained from the MVP. A data-driven rig polar
  // will replace this without changing the world/environment query boundary.
  const reach = Math.sin(relative);
  const downwind = (1 - Math.cos(relative)) * 0.25;
  const efficiency = Math.max(0.08, Math.min(1, reach * 0.9 + downwind));
  const speed = windSpeed * efficiency * 0.115 * Math.max(0, Math.min(1, sailTrim));

  return { x: hx * speed, y: hy * speed };
}

export function stepWorld(state: WorldState, dtHours: number, sailTrim = 1): WorldState {
  const wind = windAt(state.ship.position, state.time);
  const current = currentAt(state.ship.position, state.time);
  const sail = sailingVelocity(state.ship.headingDeg, wind, sailTrim);

  const vx = sail.x + current.x;
  const vy = sail.y + current.y;
  const nextPosition = offsetByNauticalMiles(state.ship.position, vx * dtHours, vy * dtHours);
  const nextTime = new Date(state.time.getTime() + dtHours * 3_600_000);

  return {
    ...state,
    time: nextTime,
    elapsedHours: state.elapsedHours + dtHours,
    ship: {
      ...state.ship,
      position: nextPosition,
      speed: Math.hypot(vx, vy),
    },
  };
}

export function distanceToDestination(state: WorldState): number {
  return greatCircleDistanceNm(state.ship.position, state.destination);
}
