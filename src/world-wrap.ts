import { WORLD_MAP_HEIGHT, WORLD_MAP_WIDTH } from './world/coordinates';

export const WRAP_TILE_OFFSETS = [
  [-1, -1], [0, -1], [1, -1],
  [-1, 0],              [1, 0],
  [-1, 1],  [0, 1],  [1, 1],
] as const;

export function wrappedTileTransform(
  offsetX: number,
  offsetY: number,
  scale: number,
  tileX: number,
  tileY: number,
) {
  return `translate(${offsetX + tileX * WORLD_MAP_WIDTH * scale}px, ${offsetY + tileY * WORLD_MAP_HEIGHT * scale}px) scale(${scale})`;
}
