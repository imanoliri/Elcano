import { WORLD_MAP_HEIGHT, WORLD_MAP_WIDTH } from './world/coordinates';

export type WorldPoint = { x: number; y: number };

export function isPolarRow(row: number) {
  return Math.abs(row % 2) === 1;
}

export function virtualWorldPoint(point: WorldPoint, column: number, row: number): WorldPoint {
  const polar = isPolarRow(row);
  return {
    x: point.x + column * WORLD_MAP_WIDTH + (polar ? WORLD_MAP_WIDTH / 2 : 0),
    y: polar
      ? (row + 1) * WORLD_MAP_HEIGHT - point.y
      : row * WORLD_MAP_HEIGHT + point.y,
  };
}

export function visibleWorldRange(
  offsetX: number,
  offsetY: number,
  scale: number,
  viewportWidth: number,
  viewportHeight: number,
) {
  const minX = -offsetX / scale;
  const maxX = (viewportWidth - offsetX) / scale;
  const minY = -offsetY / scale;
  const maxY = (viewportHeight - offsetY) / scale;
  return {
    minColumn: Math.floor(minX / WORLD_MAP_WIDTH) - 1,
    maxColumn: Math.floor(maxX / WORLD_MAP_WIDTH) + 1,
    minRow: Math.floor(minY / WORLD_MAP_HEIGHT) - 1,
    maxRow: Math.floor(maxY / WORLD_MAP_HEIGHT) + 1,
  };
}
