import {
  greatCircleDistanceNm,
  offsetByNauticalMiles,
  type EastNorthVector,
  type GeoPosition,
} from './world/coordinates';
import { currentAt, windAt } from './world/environment';
import { isAnchored, reportCoastalState, resolveLandCollision } from './coastal-navigation';
import { consumeSupplies, type ExpeditionSupplies } from './provisioning';

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
  expedition?: ExpeditionSupplies;
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

export let DEFAULT_VESSEL: VesselType = {
  id: 'nao-carrack-baseline',
  name: 'Nao / carrack',
  maxThroughWaterSpeedKn: 6,
};

export let DEFAULT_RIG_POLAR: RigPolar = {
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

let maneuveringDriveActive = false;
const MANEUVERING_DRIVE_KN: Record<string, number> = { 'lateen-hull': 1.4, 'caravel-hull': 1.1, 'nao-carrack': .8, 'galleon-hull': .6, 'square-hull': .5 };
export function setManeuveringDriveActive(active: boolean) { maneuveringDriveActive = active; }

export function configureDefaultShip(vessel: VesselType, rig: RigPolar) {
  DEFAULT_VESSEL = vessel;
  DEFAULT_RIG_POLAR = rig;
}

export { windAt, currentAt };

export function relativeWindAngleDeg(headingDeg: number, wind: Vec2): number {
  const windSpeed = Math.hypot(wind.x, wind.y);
  if (windSpeed < 0.0001) return 180;
  const heading = headingDeg * DEG;
  const hx = Math.sin(heading);
  const hy = Math.cos(heading);
  const fromX = -wind.x / windSpeed;
  const fromY = -wind.y / windSpeed;
  const dot = Math.max(-1, Math.min(1, hx * fromX + hy * fromY));
  return Math.acos(dot) / DEG;
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

export function pointOfSailFromAngle(angleDeg: number, rig: RigPolar = DEFAULT_RIG_POLAR): PointOfSail {
  const angle = Math.max(0, Math.min(180, Math.abs(angleDeg)));
  if (polarEfficiency(angle, rig) <= 0.001) return 'In irons';
  if (angle < 60) return 'Close-hauled';
  if (angle < 80) return 'Close reach';
  if (angle < 110) return 'Beam reach';
  if (angle < 160) return 'Broad reach';
  return 'Running';
}

export function pointOfSail(headingDeg: number, wind: Vec2, rig: RigPolar = DEFAULT_RIG_POLAR): PointOfSail {
  return pointOfSailFromAngle(relativeWindAngleDeg(headingDeg, wind), rig);
}

export function sailingVelocity(
  headingDeg: number,
  wind: Vec2,
  sailTrim = 1,
  rig: RigPolar = DEFAULT_RIG_POLAR,
  vessel: VesselType = DEFAULT_VESSEL,
): Vec2 {
  const heading = headingDeg * DEG;
  const hx = Math.sin(heading);
  const hy = Math.cos(heading);
  const windSpeed = Math.hypot(wind.x, wind.y);
  if (windSpeed < 0.0001) return { x: 0, y: 0 };
  const angle = relativeWindAngleDeg(headingDeg, wind);
  const efficiency = polarEfficiency(angle, rig);
  const trim = Math.max(0, Math.min(1, sailTrim));
  const unconstrainedSpeed = windSpeed * efficiency * rig.speedScale * trim;
  const speed = Math.min(unconstrainedSpeed, vessel.maxThroughWaterSpeedKn);
  return { x: hx * speed, y: hy * speed };
}

export function maneuveringDriveVelocity(headingDeg: number, wind: Vec2, sailTrim = 1): Vec2 {
  const sail = sailingVelocity(headingDeg, wind, sailTrim);
  const sailingSpeed = Math.hypot(sail.x, sail.y);
  const drive = maneuveringDriveActive && sailTrim <= .25 && sailingSpeed < 1.5
    ? MANEUVERING_DRIVE_KN[DEFAULT_VESSEL.id] ?? .6
    : 0;
  const heading = headingDeg * DEG;
  return { x: Math.sin(heading) * drive, y: Math.cos(heading) * drive };
}

export function stepWorld(state: WorldState, dtHours: number, sailTrim = 1): WorldState {
  const nextTime = new Date(state.time.getTime() + dtHours * 3_600_000);

  if (isAnchored()) {
    reportCoastalState(state.ship.position, false);
    return {
      ...state,
      time: nextTime,
      elapsedHours: state.elapsedHours + dtHours,
      ship: { ...state.ship, speed: 0 },
      expedition: state.expedition ? consumeSupplies(state.expedition, dtHours) : undefined,
    };
  }

  const wind = windAt(state.ship.position, state.time);
  const current = currentAt(state.ship.position, state.time);
  const sail = sailingVelocity(state.ship.headingDeg, wind, sailTrim);
  const drive = maneuveringDriveVelocity(state.ship.headingDeg, wind, sailTrim);
  const vx = sail.x + drive.x + current.x;
  const vy = sail.y + drive.y + current.y;
  const proposed = offsetByNauticalMiles(state.ship.position, vx * dtHours, vy * dtHours);
  const collision = resolveLandCollision(state.ship.position, proposed);
  reportCoastalState(collision.position, collision.collided);

  return {
    ...state,
    time: nextTime,
    elapsedHours: state.elapsedHours + dtHours,
    ship: {
      ...state.ship,
      position: collision.position,
      speed: collision.collided ? 0 : Math.hypot(vx, vy),
    },
    expedition: state.expedition ? consumeSupplies(state.expedition, dtHours) : undefined,
  };
}

export function distanceToDestination(state: WorldState): number {
  return greatCircleDistanceNm(state.ship.position, state.destination);
}
