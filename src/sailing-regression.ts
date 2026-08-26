import {
  pointOfSail,
  relativeWindAngleDeg,
  sailingVelocity,
  type PointOfSail,
  type Vec2,
} from './simulation';

export type BiscaySailingCase = {
  id: string;
  place: string;
  position: { lat: number; lon: number };
  headingDeg: number;
  windFromDeg: number;
  windSpeedKn: number;
  currentTowardDeg: number;
  currentSpeedKn: number;
  expectedPointOfSail: PointOfSail;
};

function vectorToward(speed: number, bearingDeg: number): Vec2 {
  const radians = bearingDeg * Math.PI / 180;
  return { x: Math.sin(radians) * speed, y: Math.cos(radians) * speed };
}

export function windVectorFrom(speed: number, fromBearingDeg: number): Vec2 {
  return vectorToward(speed, fromBearingDeg + 180);
}

export const BISCAY_SAILING_CASES: readonly BiscaySailingCase[] = [
  {
    id: 'san-sebastian-in-irons',
    place: 'San Sebastián',
    position: { lat: 43.3183, lon: -1.9812 },
    headingDeg: 270,
    windFromDeg: 270,
    windSpeedKn: 12,
    currentTowardDeg: 90,
    currentSpeedKn: 0.45,
    expectedPointOfSail: 'In irons',
  },
  {
    id: 'bilbao-close-hauled',
    place: 'Bilbao',
    position: { lat: 43.35, lon: -3.05 },
    headingDeg: 315,
    windFromDeg: 270,
    windSpeedKn: 12,
    currentTowardDeg: 90,
    currentSpeedKn: 0.45,
    expectedPointOfSail: 'Close-hauled',
  },
  {
    id: 'santander-close-reach',
    place: 'Santander',
    position: { lat: 43.55, lon: -3.8 },
    headingDeg: 335,
    windFromDeg: 270,
    windSpeedKn: 12,
    currentTowardDeg: 90,
    currentSpeedKn: 0.45,
    expectedPointOfSail: 'Close reach',
  },
  {
    id: 'gijon-beam-reach',
    place: 'Gijón',
    position: { lat: 43.62, lon: -5.67 },
    headingDeg: 0,
    windFromDeg: 270,
    windSpeedKn: 12,
    currentTowardDeg: 90,
    currentSpeedKn: 0.45,
    expectedPointOfSail: 'Beam reach',
  },
  {
    id: 'ribadeo-broad-reach',
    place: 'Ribadeo',
    position: { lat: 43.57, lon: -7.04 },
    headingDeg: 30,
    windFromDeg: 270,
    windSpeedKn: 12,
    currentTowardDeg: 90,
    currentSpeedKn: 0.45,
    expectedPointOfSail: 'Broad reach',
  },
  {
    id: 'a-coruna-running',
    place: 'A Coruña',
    position: { lat: 43.3623, lon: -8.4115 },
    headingDeg: 90,
    windFromDeg: 270,
    windSpeedKn: 12,
    currentTowardDeg: 90,
    currentSpeedKn: 0.45,
    expectedPointOfSail: 'Running',
  },
  {
    id: 'screenshot-light-air-close-reach',
    place: 'San Sebastián screenshot regression',
    position: { lat: 43.3183, lon: -1.9812 },
    headingDeg: 277,
    windFromDeg: 347,
    windSpeedKn: 3,
    currentTowardDeg: 90,
    currentSpeedKn: 0.45,
    expectedPointOfSail: 'Close reach',
  },
];

export function evaluateBiscaySailingCase(testCase: BiscaySailingCase) {
  const wind = windVectorFrom(testCase.windSpeedKn, testCase.windFromDeg);
  const current = vectorToward(testCase.currentSpeedKn, testCase.currentTowardDeg);
  const sail = sailingVelocity(testCase.headingDeg, wind, 1);
  const ground = { x: sail.x + current.x, y: sail.y + current.y };
  const actualPointOfSail = pointOfSail(testCase.headingDeg, wind);

  return {
    ...testCase,
    relativeWindAngleDeg: relativeWindAngleDeg(testCase.headingDeg, wind),
    actualPointOfSail,
    throughWaterSpeedKn: Math.hypot(sail.x, sail.y),
    groundSpeedKn: Math.hypot(ground.x, ground.y),
    pass: actualPointOfSail === testCase.expectedPointOfSail,
  };
}

export function runBiscaySailingRegression() {
  return BISCAY_SAILING_CASES.map(evaluateBiscaySailingCase);
}
