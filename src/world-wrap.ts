import { WORLD_MAP_WIDTH } from './world/coordinates';

export type WorldPoint = { x: number; y: number };

/**
 * Compatibility helper for overlays that still branch on the old polar-row
 * renderer. Vertical wrapping is no longer supported, so no row is polar.
 */
export function isPolarRow(_row: number) {
  return false;
}

/**
 * The geographic chart wraps only in longitude. Latitude is bounded by the
 * poles; reflecting/repeating the map vertically creates false geography and
 * visible horizontal seams on tall/mobile viewports.
 */
export function virtualWorldPoint(point: WorldPoint, column: number, _row = 0): WorldPoint {
  return {
    x: point.x + column * WORLD_MAP_WIDTH,
    y: point.y,
  };
}

export function visibleWorldRange(
  offsetX: number,
  _offsetY: number,
  scale: number,
  viewportWidth: number,
  _viewportHeight: number,
) {
  const minX = -offsetX / scale;
  const maxX = (viewportWidth - offsetX) / scale;
  return {
    minColumn: Math.floor(minX / WORLD_MAP_WIDTH) - 1,
    maxColumn: Math.floor(maxX / WORLD_MAP_WIDTH) + 1,
    minRow: 0,
    maxRow: 0,
  };
}
