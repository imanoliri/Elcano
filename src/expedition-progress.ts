export const EXPEDITION_SCHEMA_VERSION = 1;
const STORAGE_KEY = 'elcano.expedition-progress';

export type VoyageRecord = { completedAt: string; elapsedHours: number; bestElapsedHours?: number; distanceNm: number; shipId: string; route: { lat: number; lon: number }[] };
export type ExpeditionProgress = { version: number; exploredCells: string[]; voyages: Record<string, VoyageRecord> };

const empty = (): ExpeditionProgress => ({ version: EXPEDITION_SCHEMA_VERSION, exploredCells: [], voyages: {} });
let progress = read();
let saveTimer: number | undefined;

function read(): ExpeditionProgress {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
    if (!parsed || typeof parsed !== 'object') return empty();
    const value = parsed as Partial<ExpeditionProgress>;
    return {
      version: EXPEDITION_SCHEMA_VERSION,
      exploredCells: Array.isArray(value.exploredCells) ? value.exploredCells.filter((cell): cell is string => typeof cell === 'string').slice(0, 50000) : [],
      voyages: value.voyages && typeof value.voyages === 'object' ? value.voyages as Record<string, VoyageRecord> : {},
    };
  } catch { return empty(); }
}

function scheduleSave() {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch { /* private mode/storage quota: play normally */ }
  }, 350);
}

export function getExpeditionProgress() { return progress; }
export function saveExploredCells(cells: Iterable<string>) { progress.exploredCells = [...cells]; scheduleSave(); }
export function recordVoyage(missionId: string, voyage: VoyageRecord) {
  const prior = progress.voyages[missionId];
  // One record per mission: latest attempt, while the best time remains available for comparison.
  progress.voyages[missionId] = { ...voyage, bestElapsedHours: Math.min(prior?.bestElapsedHours ?? prior?.elapsedHours ?? Infinity, voyage.elapsedHours) };
  scheduleSave();
}
export function voyageForMission(missionId: string) { return progress.voyages[missionId]; }
export function bestTimeForMission(missionId: string) { const v = progress.voyages[missionId]; return v?.bestElapsedHours ?? v?.elapsedHours; }
export function resetExpeditionProgress() { progress = empty(); window.clearTimeout(saveTimer); try { window.localStorage.removeItem(STORAGE_KEY); } catch {} }
