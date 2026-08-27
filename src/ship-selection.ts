import {
  configureDefaultShip,
  type RigPolar,
  type VesselType,
} from './simulation';

export type ShipPreset = {
  id: string;
  name: string;
  rigLabel: string;
  description: string;
  vessel: VesselType;
  rig: RigPolar;
};

export const SHIP_PRESETS: readonly ShipPreset[] = [
  {
    id: 'caravel', name: 'Caravel', rigLabel: 'Mixed rig · agile',
    description: 'Light and responsive, with useful performance at tighter wind angles.',
    vessel: { id: 'caravel-hull', name: 'Caravel', maxThroughWaterSpeedKn: 6.4 },
    rig: { id: 'caravel-mixed-rig', name: 'Caravel · mixed rig', speedScale: 0.47, points: [
      { angleDeg: 0, efficiency: 0 }, { angleDeg: 30, efficiency: 0 }, { angleDeg: 35, efficiency: 0.28 }, { angleDeg: 40, efficiency: 0.5 }, { angleDeg: 50, efficiency: 0.7 }, { angleDeg: 70, efficiency: 0.9 }, { angleDeg: 90, efficiency: 1 }, { angleDeg: 120, efficiency: 0.92 }, { angleDeg: 150, efficiency: 0.78 }, { angleDeg: 180, efficiency: 0.66 },
    ] },
  },
  {
    id: 'nao', name: 'Nao / Carrack', rigLabel: 'Balanced rig · default',
    description: 'A balanced exploration ship with dependable performance across most points of sail.',
    vessel: { id: 'nao-carrack', name: 'Nao / carrack', maxThroughWaterSpeedKn: 6 },
    rig: { id: 'nao-balanced-rig', name: 'Nao / carrack · balanced rig', speedScale: 0.45, points: [
      { angleDeg: 0, efficiency: 0 }, { angleDeg: 35, efficiency: 0 }, { angleDeg: 40, efficiency: 0.42 }, { angleDeg: 45, efficiency: 0.55 }, { angleDeg: 60, efficiency: 0.72 }, { angleDeg: 90, efficiency: 1 }, { angleDeg: 120, efficiency: 0.95 }, { angleDeg: 150, efficiency: 0.85 }, { angleDeg: 180, efficiency: 0.72 },
    ] },
  },
  {
    id: 'galleon', name: 'Galleon', rigLabel: 'Heavy square rig · powerful',
    description: 'Heavy and less versatile upwind, but fast and steady when the wind is abaft the beam.',
    vessel: { id: 'galleon-hull', name: 'Galleon', maxThroughWaterSpeedKn: 7 },
    rig: { id: 'galleon-square-rig', name: 'Galleon · heavy square rig', speedScale: 0.5, points: [
      { angleDeg: 0, efficiency: 0 }, { angleDeg: 42, efficiency: 0 }, { angleDeg: 48, efficiency: 0.25 }, { angleDeg: 60, efficiency: 0.55 }, { angleDeg: 90, efficiency: 0.88 }, { angleDeg: 120, efficiency: 1 }, { angleDeg: 150, efficiency: 1 }, { angleDeg: 180, efficiency: 0.94 },
    ] },
  },
  {
    id: 'lateen', name: 'Lateen Vessel', rigLabel: 'Lateen rig · upwind specialist',
    description: 'Best choice for sailing close to the wind, trading away some downwind power.',
    vessel: { id: 'lateen-hull', name: 'Lateen-rigged vessel', maxThroughWaterSpeedKn: 5.8 },
    rig: { id: 'lateen-rig', name: 'Lateen rig', speedScale: 0.43, points: [
      { angleDeg: 0, efficiency: 0 }, { angleDeg: 25, efficiency: 0 }, { angleDeg: 30, efficiency: 0.3 }, { angleDeg: 35, efficiency: 0.55 }, { angleDeg: 45, efficiency: 0.78 }, { angleDeg: 60, efficiency: 0.92 }, { angleDeg: 90, efficiency: 1 }, { angleDeg: 120, efficiency: 0.86 }, { angleDeg: 150, efficiency: 0.7 }, { angleDeg: 180, efficiency: 0.58 },
    ] },
  },
  {
    id: 'square', name: 'Square-Rigged Vessel', rigLabel: 'Square rig · downwind specialist',
    description: 'Poor close to the wind, exceptional on broad reaches and runs.',
    vessel: { id: 'square-hull', name: 'Square-rigged vessel', maxThroughWaterSpeedKn: 6.7 },
    rig: { id: 'square-rig', name: 'Square rig', speedScale: 0.49, points: [
      { angleDeg: 0, efficiency: 0 }, { angleDeg: 45, efficiency: 0 }, { angleDeg: 55, efficiency: 0.28 }, { angleDeg: 70, efficiency: 0.58 }, { angleDeg: 90, efficiency: 0.82 }, { angleDeg: 120, efficiency: 0.98 }, { angleDeg: 150, efficiency: 1 }, { angleDeg: 180, efficiency: 0.98 },
    ] },
  },
];

export function shipPresetFromId(id: string | null | undefined): ShipPreset {
  return SHIP_PRESETS.find((preset) => preset.id === id)
    ?? SHIP_PRESETS.find((preset) => preset.id === 'nao')!;
}

const selected = new URL(window.location.href).searchParams.get('ship');
const activePreset = shipPresetFromId(selected);
configureDefaultShip(activePreset.vessel, activePreset.rig);
