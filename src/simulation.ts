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

export type PolarPoint = {
  angleDeg: number;
  efficiency: number;
};

export type RigPolar = {
  id: string;
  name: string;
  points: readonly PolarPoint[];
  speedScale: number;
};

export type VesselType = {
  id: string;
  name: string;
  /** Maximum vessel speed through the water in knots, before current is added. */
  maxThroughWaterSpeedKn: number;
};

export type PointOfSail =
  | 'In irons'
  | 'Close-hauled'
  | 'Close reach'
  | 'Beam reach'
  | 'Broad reach'
  | 'Running';

const DEG = Math.PI / 180;

/**
 * Baseline hull for the current playable nao/carrack.
 *
 * Historical anchors:
 * - Deutsches Historisches Museum: representative c.1490 nao ≈ 6 kn.
 * - Fundación Nao Victoria: reconstructed Victoria average ≈ 3.5 kn.
 *
 * The cap represents rapidly increasing hydrodynamic resistance of a heavy
 * displacement hull. It limits speed through the water; current is added
 * afterwards and can increase or decrease speed over the ground.
 */
export const DEFAULT_VESSEL: VesselType = {
  id: 'nao-carrack-baseline',
  name: 'Nao / carrack',
  maxThroughWaterSpeedKn: 6,
};

/**
 * Carrack/nao-style baseline polar. Angle is measured from the direction the
 * wind comes FROM: 0° is directly into the wind and 180° is directly downwind.
 *
 * Calibration goal: Victoria-like passage speeds should normally sit in the
 * 2.5–4 kn range in usable wind, while a well-sailed vessel can approach the
 * 6 kn hull cap on favorable reaches. Close-hauled performance is deliberately
 * stronger than the first MVP polar so leaving the no-go zone produces useful
 * headway rather than drift-level speeds that ordinary Biscay currents can
 * cancel almost completely.
 */
export const DEFAULT_RIG_POLAR: RigPolar = {
  id: 'carrack-square-baseline',
  name: 'Carrack · square-rig baseline',
  speedScale: 0.45,
  points: [
    { angleDeg: 0, efficiency: 0 },
    { angleDeg: 35, efficiency: 0 },
    { angleDeg: 40, efficiency: 0.42 },
    { angleDeg: 45, efficiency: 0.55 },
    { angleDeg: 60, efficiency: 0.72 },
    { angleDeg: 90, efficiency: 1 },
    { angleDeg: 120, efficiency: 0.95 },
    { angleDeg: 150, efficiency: 0.85 },
    { angleDeg: 180, efficiency: 0.72 },
  ],
};

/**
 * Internal environmental vectors use east/north components in knots and point
 * toward the direction the air/water is travelling.
 */
export { windAt, currentAt };

export function relativeWindAngleDeg(headingDeg: number, wind: Vec2): number {
  const windSpeed = Math.hypot(wind.x, wind.y);
  if (windSpeed < 0.0001) return 180;

  const heading = headingDeg * DEG;
  const hx = Math.sin(heading);
  const hy = Math.cos(heading);

  // Environment vectors point where air travels toward, so negate the unit
  // vector to obtain the direction the wind comes from.
  const fromX = -wind.x / windSpeed;
  const fromY = -wind.y / windSpeed;
  const dot = Math.max(-1, Math.min(1, hx * fromX + hy * fromY));
  return Math.acos(dot) / DEG;
}

export function pointOfSailFromAngle(angleDeg: number): PointOfSail {
  const angle = Math.max(0, Math.min(180, Math.abs(angleDeg)));
  if (angle < 40) return 'In irons';
  if (angle < 60) return 'Close-hauled';
  if (angle < 80) return 'Close reach';
  if (angle < 110) return 'Beam reach';
  if (angle < 160) return 'Broad reach';
  return 'Running';
}

export function pointOfSail(headingDeg: number, wind: Vec2): PointOfSail {
  return pointOfSailFromAngle(relativeWindAngleDeg(headingDeg, wind));
}

export function polarEfficiency(angleDeg: number, rig: RigPolar = DEFAULT_RIG_POLAR): number {
  const angle = Math.max(0, Math.min(180, Math.abs(angleDeg)));
  const points = rig.points;
  if (points.length === 0) return 0;
  if (angle <= points[0].angleDeg) return points[0].efficiency;

  for (let index = 1; index < points.length; index += 1) {
    const upper = points[index];
    if (angle <= upper.angleDeg) {
      const lower = points[index - 1];
      const span = upper.angleDeg - lower.angleDeg;
      if (span <= 0) return upper.efficiency;
      const t = (angle - lower.angleDeg) / span;
      return lower.efficiency + (upper.efficiency - lower.efficiency) * t;
    }
  }

  return points[points.length - 1].efficiency;
}

export function sailingVelocity(
  headingDeg: number,
  wind: Vec2,
  sailTrim = 1,
  rig: RigPolar = DEFAULT_RIG_POLAR,
  vessel: VesselType = DEFAULT_VESSEL,
): Vec2 {
  const heading = headingDeg * DEG;
  const hx = Math.sin(heading); // east; nautical 0° is north
  const hy = Math.cos(heading); // north

  const windSpeed = Math.hypot(wind.x, wind.y);
  if (windSpeed < 0.0001) return { x: 0, y: 0 };

  const angle = relativeWindAngleDeg(headingDeg, wind);
  const efficiency = polarEfficiency(angle, rig);
  const trim = Math.max(0, Math.min(1, sailTrim));
  const unconstrainedSpeed = windSpeed * efficiency * rig.speedScale * trim;
  const speed = Math.min(unconstrainedSpeed, vessel.maxThroughWaterSpeedKn);

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
