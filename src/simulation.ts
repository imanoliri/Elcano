export type Vec2 = { x: number; y: number };

export type ShipState = {
  x: number;
  y: number;
  headingDeg: number;
  speed: number;
};

export type WorldState = {
  timeHours: number;
  ship: ShipState;
  destination: Vec2;
};

const DEG = Math.PI / 180;

export function windAt(x: number, y: number, timeHours: number): Vec2 {
  const seasonal = Math.sin(timeHours / 24 / 5) * 0.15;
  const angle = (205 + y * 0.05 + seasonal * 25) * DEG;
  const strength = 0.95 + 0.2 * Math.sin((x + y) * 0.025);
  return { x: Math.cos(angle) * strength, y: Math.sin(angle) * strength };
}

export function currentAt(x: number, y: number): Vec2 {
  const band = Math.sin(y * 0.035) * 0.35;
  return {
    x: 0.28 + band,
    y: 0.08 * Math.sin(x * 0.045),
  };
}

export function sailingVelocity(headingDeg: number, wind: Vec2): Vec2 {
  const heading = headingDeg * DEG;
  const hx = Math.cos(heading);
  const hy = Math.sin(heading);

  const windSpeed = Math.hypot(wind.x, wind.y);
  const wx = wind.x / windSpeed;
  const wy = wind.y / windSpeed;

  const dot = Math.max(-1, Math.min(1, hx * wx + hy * wy));
  const relative = Math.acos(dot);

  // Simple polar approximation: sailing directly into the wind is poor,
  // beam/broad reach is strongest, dead downwind is decent but slower.
  const reach = Math.sin(relative);
  const downwind = (1 - Math.cos(relative)) * 0.25;
  const efficiency = Math.max(0.08, Math.min(1, reach * 0.9 + downwind));
  const speed = windSpeed * efficiency * 1.5;

  return { x: hx * speed, y: hy * speed };
}

export function stepWorld(state: WorldState, dtHours: number): WorldState {
  const wind = windAt(state.ship.x, state.ship.y, state.timeHours);
  const current = currentAt(state.ship.x, state.ship.y);
  const sail = sailingVelocity(state.ship.headingDeg, wind);

  const vx = sail.x + current.x;
  const vy = sail.y + current.y;
  const nextShip = {
    ...state.ship,
    x: state.ship.x + vx * dtHours,
    y: state.ship.y + vy * dtHours,
    speed: Math.hypot(vx, vy),
  };

  return {
    ...state,
    timeHours: state.timeHours + dtHours,
    ship: nextShip,
  };
}

export function distanceToDestination(state: WorldState): number {
  return Math.hypot(
    state.destination.x - state.ship.x,
    state.destination.y - state.ship.y,
  );
}
