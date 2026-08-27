export const EXPLORATION_CELL = 30;
export const EXPLORATION_RADIUS = 100;

const exploredCells = new Set<string>();

function keyForWorldPoint(point: { x: number; y: number }) {
  return `${Math.round(point.x / EXPLORATION_CELL)},${Math.round(point.y / EXPLORATION_CELL)}`;
}

function announceExplorationChange() {
  window.dispatchEvent(new CustomEvent('elcano:exploration-change'));
}

export function isWorldPointExplored(point: { x: number; y: number }) {
  return exploredCells.has(keyForWorldPoint(point));
}

export function revealAroundWorldPoint(point: { x: number; y: number }, radius = EXPLORATION_RADIUS) {
  let changed = false;
  for (let x = point.x - radius; x <= point.x + radius; x += EXPLORATION_CELL) {
    for (let y = point.y - radius; y <= point.y + radius; y += EXPLORATION_CELL) {
      if (Math.hypot(x - point.x, y - point.y) > radius) continue;
      const key = keyForWorldPoint({ x, y });
      if (exploredCells.has(key)) continue;
      exploredCells.add(key);
      changed = true;
    }
  }
  if (changed) announceExplorationChange();
  return changed;
}

export function clearExploration() {
  if (exploredCells.size === 0) return;
  exploredCells.clear();
  announceExplorationChange();
}
