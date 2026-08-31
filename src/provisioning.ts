export type CargoKind = 'water' | 'provisions' | 'repairStores' | 'tradeGoods' | 'gold' | 'arms';

export type ProvisioningLoadout = Record<CargoKind, number> & {
  sailors: number;
  soldiers: number;
};

export type ShipProvisioningProfile = {
  /** Historical carrying capacity. Tons burden are a volume/capacity measure, not metric tonnes. */
  holdCapacityTons: number;
  /** Comfortable game limit, derived from the referenced historical complement. */
  crewCapacity: number;
  historicalReference: string;
  sourceNote: string;
  defaultLoadout: ProvisioningLoadout;
};

export const CARGO_LABELS: Record<CargoKind, string> = {
  water: 'Water',
  provisions: 'Provisions',
  repairStores: 'Repair stores',
  tradeGoods: 'Trade goods & gifts',
  gold: 'Gold',
  arms: 'Arms & ammunition',
};

const cargo = (water: number, provisions: number, repairStores: number, tradeGoods: number, gold: number, arms: number, sailors: number, soldiers: number): ProvisioningLoadout => ({ water, provisions, repairStores, tradeGoods, gold, arms, sailors, soldiers });

/**
 * References are deliberately attached to representative vessels, not claimed as
 * universal measurements for every ship in a broad historical class.
 */
export const SHIP_PROVISIONING: Record<string, ShipProvisioningProfile> = {
  lateen: {
    holdCapacityTons: 50, crewCapacity: 24,
    historicalReference: '15th-century Portuguese lateen caravel',
    sourceNote: 'Typical caravels are commonly estimated at 50–60 tons burden; complement is a gameplay approximation.',
    defaultLoadout: cargo(8, 5, 3, 18, 1, 3, 19, 3),
  },
  caravel: {
    holdCapacityTons: 75, crewCapacity: 31,
    historicalReference: 'Santiago, Magellan expedition (1519)',
    sourceNote: 'Santiago: 75 toneles (90 toneladas) and 31 men.',
    defaultLoadout: cargo(11, 7, 4, 26, 1, 4, 25, 6),
  },
  nao: {
    holdCapacityTons: 85, crewCapacity: 44,
    historicalReference: 'Nao Victoria, Magellan–Elcano expedition (1519)',
    sourceNote: 'Victoria: 85 toneles and about 42–44 men.',
    defaultLoadout: cargo(14, 9, 5, 30, 1, 5, 34, 8),
  },
  galleon: {
    holdCapacityTons: 500, crewCapacity: 150,
    historicalReference: 'Spanish Atlantic galleon, 16th–17th century',
    sourceNote: 'Spanish galleons carried roughly 500–1,200 tons and up to 150 people; this is the small end of that documented range.',
    defaultLoadout: cargo(72, 46, 32, 260, 8, 35, 105, 45),
  },
  square: {
    holdCapacityTons: 60, crewCapacity: 30,
    historicalReference: 'Iberian zabra, early 16th century',
    sourceNote: 'Documented zabras ranged from 20–60 tons; this profile represents a large, square-rigged example.',
    defaultLoadout: cargo(9, 6, 4, 25, 1, 4, 23, 7),
  },
};

export const WATER_TONS_PER_PERSON_PER_DAY = 0.003;
export const PROVISIONS_TONS_PER_PERSON_PER_DAY = 0.0015;
/** Game abstraction in historical maravedís: soldiers are deliberately costlier than sailors. */
export const SAILOR_WAGE_MARAVEDIS_PER_DAY = 40;
export const SOLDIER_WAGE_MARAVEDIS_PER_DAY = 50;
export const GOLD_VALUE_MARAVEDIS_PER_TON = 100_000;

export function profileForShip(shipId: string) { return SHIP_PROVISIONING[shipId] ?? SHIP_PROVISIONING.nao; }
export function crewTotal(loadout: ProvisioningLoadout) { return loadout.sailors + loadout.soldiers; }
export function cargoTotal(loadout: ProvisioningLoadout) { return loadout.water + loadout.provisions + loadout.repairStores + loadout.tradeGoods + loadout.gold + loadout.arms; }
export function dailyWaterUse(loadout: ProvisioningLoadout) { return crewTotal(loadout) * WATER_TONS_PER_PERSON_PER_DAY; }
export function dailyProvisionsUse(loadout: ProvisioningLoadout) { return crewTotal(loadout) * PROVISIONS_TONS_PER_PERSON_PER_DAY; }
export function dailyWages(loadout: ProvisioningLoadout) { return loadout.sailors * SAILOR_WAGE_MARAVEDIS_PER_DAY + loadout.soldiers * SOLDIER_WAGE_MARAVEDIS_PER_DAY; }
export function enduranceDays(loadout: ProvisioningLoadout) {
  const water = dailyWaterUse(loadout);
  const provisions = dailyProvisionsUse(loadout);
  return Math.max(0, Math.floor(Math.min(water > 0 ? loadout.water / water : Infinity, provisions > 0 ? loadout.provisions / provisions : Infinity)));
}

export function loadoutFromParams(params: URLSearchParams, shipId: string): ProvisioningLoadout {
  const defaults = { ...profileForShip(shipId).defaultLoadout };
  (Object.keys(CARGO_LABELS) as CargoKind[]).forEach((kind) => {
    const value = Number(params.get(kind)); if (Number.isFinite(value) && value >= 0) defaults[kind] = value;
  });
  (['sailors', 'soldiers'] as const).forEach((kind) => {
    const value = Number(params.get(kind)); if (Number.isInteger(value) && value >= 0) defaults[kind] = value;
  });
  return defaults;
}

export type ExpeditionSupplies = ProvisioningLoadout & { goldMaravedis: number };
export function suppliesFromLoadout(loadout: ProvisioningLoadout): ExpeditionSupplies { return { ...loadout, goldMaravedis: loadout.gold * GOLD_VALUE_MARAVEDIS_PER_TON }; }
export function consumeSupplies(supplies: ExpeditionSupplies, dtHours: number): ExpeditionSupplies {
  const days = Math.max(0, dtHours) / 24;
  const people = crewTotal(supplies);
  return {
    ...supplies,
    water: Math.max(0, supplies.water - people * WATER_TONS_PER_PERSON_PER_DAY * days),
    provisions: Math.max(0, supplies.provisions - people * PROVISIONS_TONS_PER_PERSON_PER_DAY * days),
    goldMaravedis: Math.max(0, supplies.goldMaravedis - dailyWages(supplies) * days),
  };
}
