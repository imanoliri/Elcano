import './camera-ui.css';
import { WORLD_MAP_HEIGHT, WORLD_MAP_WIDTH } from './world/coordinates';
import { WRAP_TILE_OFFSETS, wrappedTileTransform } from './world-wrap';

const canvas = document.querySelector<HTMLCanvasElement>('#ocean')!;
const viewport = document.querySelector<HTMLElement>('.game-shell')!;

if (canvas && viewport) {
  const indicator = document.createElement('div');
  indicator.className = 'target-edge-indicator';
  indicator.setAttribute('aria-hidden', 'true');
  viewport.append(indicator);

  const wrapTiles = WRAP_TILE_OFFSETS.map(([tileX, tileY]) => {
    const tile = document.createElement('canvas');
    tile.width = canvas.width;
    tile.height = canvas.height;
    tile.className = `${canvas.className} world-wrap-tile`;
    tile.setAttribute('aria-hidden', 'true');
    tile.dataset.wrapX = String(tileX);
    tile.dataset.wrapY = String(tileY);
    tile.style.pointerEvents = 'none';
    canvas.insertAdjacentElement('afterend', tile);
    return { tile, tileX, tileY, ctx: tile.getContext('2d')! };
  });

  let target = { x: WORLD_MAP_WIDTH / 2, y: WORLD_MAP_HEIGHT / 2 };
  let scale = 1;
  let minScale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let draggingPointer: number | null = null;
  let lastPointer = { x: 0, y: 0 };
  const pointers = new Map<number, { x: number; y: number }>();
  let pinchStartDistance = 0;
  let pinchStartScale = 1;
  let pinchWorldAnchor = { x: 0, y: 0 };

  // Bay of Biscay framing for the San Sebastián → A Coruña tutorial.
  const tutorialCenter = { x: 699.2, y: 263.6 };
  const INITIAL_ZOOM_MULTIPLIER = 50;
  const MAX_ZOOM_MULTIPLIER = 256;

  canvas.style.width = `${WORLD_MAP_WIDTH}px`;
  canvas.style.height = `${WORLD_MAP_HEIGHT}px`;
  wrapTiles.forEach(({ tile }) => {
    tile.style.width = `${WORLD_MAP_WIDTH}px`;
    tile.style.height = `${WORLD_MAP_HEIGHT}px`;
  });

  function viewportSize() {
    return { width: viewport.clientWidth, height: viewport.clientHeight };
  }

  function positiveModulo(value: number, modulus: number) {
    return ((value % modulus) + modulus) % modulus;
  }

  function normalizeCamera() {
    const mapWidth = WORLD_MAP_WIDTH * scale;
    const mapHeight = WORLD_MAP_HEIGHT * scale;
    // Keep the canonical tile near the viewport while the eight copies around
    // it make crossing any edge continuous instead of exposing empty space.
    offsetX = -positiveModulo(-offsetX, mapWidth);
    offsetY = -positiveModulo(-offsetY, mapHeight);
  }

  function syncWrapTiles() {
    for (const { tile, ctx } of wrapTiles) {
      ctx.clearRect(0, 0, tile.width, tile.height);
      ctx.drawImage(canvas, 0, 0);
    }
  }

  function announceCamera() {
    const zoomMultiplier = scale / Math.max(0.0001, minScale);
    canvas.dataset.cameraScale = String(scale);
    canvas.dataset.zoomMultiplier = String(zoomMultiplier);
    window.dispatchEvent(new CustomEvent('elcano:camera-change', {
      detail: { x: offsetX, y: offsetY, scale, minScale, zoomMultiplier, wrapped: true },
    }));
  }

  function applyCamera() {
    normalizeCamera();
    canvas.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    for (const { tile, tileX, tileY } of wrapTiles) {
      tile.style.transform = wrappedTileTransform(offsetX, offsetY, scale, tileX, tileY);
    }
    announceCamera();
    updateTargetIndicator();
  }

  function resetCamera() {
    const { width } = viewportSize();
    minScale = width / WORLD_MAP_WIDTH;
    scale = Math.max(minScale, minScale * INITIAL_ZOOM_MULTIPLIER);
    offsetX = width / 2 - tutorialCenter.x * scale;
    offsetY = viewport.clientHeight / 2 - tutorialCenter.y * scale;
    applyCamera();
  }

  function zoomAround(screenX: number, screenY: number, nextScale: number) {
    const clampedScale = Math.max(minScale, Math.min(minScale * MAX_ZOOM_MULTIPLIER, nextScale));
    const worldX = (screenX - offsetX) / scale;
    const worldY = (screenY - offsetY) / scale;
    scale = clampedScale;
    offsetX = screenX - worldX * scale;
    offsetY = screenY - worldY * scale;
    applyCamera();
  }

  function nearestWrappedScreenPoint(point: { x: number; y: number }) {
    const { width, height } = viewportSize();
    let best = { x: 0, y: 0, distance: Infinity };
    for (let tileY = -1; tileY <= 1; tileY += 1) {
      for (let tileX = -1; tileX <= 1; tileX += 1) {
        const x = offsetX + (point.x + tileX * WORLD_MAP_WIDTH) * scale;
        const y = offsetY + (point.y + tileY * WORLD_MAP_HEIGHT) * scale;
        const distance = Math.hypot(x - width / 2, y - height / 2);
        if (distance < best.distance) best = { x, y, distance };
      }
    }
    return best;
  }

  function updateTargetIndicator() {
    const { width, height } = viewportSize();
    const wrapped = nearestWrappedScreenPoint(target);
    const x = wrapped.x;
    const y = wrapped.y;
    const margin = 22;
    const inside = x >= margin && x <= width - margin && y >= margin && y <= height - margin;

    if (inside) {
      indicator.style.display = 'none';
      return;
    }

    indicator.style.display = 'block';
    const cx = width / 2;
    const cy = height / 2;
    const dx = x - cx;
    const dy = y - cy;
    const safeDx = Math.abs(dx) < 0.0001 ? 0.0001 : dx;
    const safeDy = Math.abs(dy) < 0.0001 ? 0.0001 : dy;
    const tx = dx === 0 ? Infinity : (width / 2 - margin) / Math.abs(safeDx);
    const ty = dy === 0 ? Infinity : (height / 2 - margin) / Math.abs(safeDy);
    const t = Math.min(tx, ty);
    const px = cx + dx * t;
    const py = cy + dy * t;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    indicator.style.left = `${px}px`;
    indicator.style.top = `${py}px`;
    indicator.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
  }

  function pointFromEvent(event: PointerEvent) {
    const rect = viewport.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function screenPointToWrappedWorld(screenX: number, screenY: number) {
    return {
      x: positiveModulo((screenX - offsetX) / scale, WORLD_MAP_WIDTH),
      y: positiveModulo((screenY - offsetY) / scale, WORLD_MAP_HEIGHT),
    };
  }

  window.addEventListener('elcano:camera-target', (event) => {
    const detail = (event as CustomEvent<{ x: number; y: number }>).detail;
    if (!detail) return;
    target = detail;
    updateTargetIndicator();
  });

  viewport.addEventListener('wheel', (event) => {
    event.preventDefault();
    const rect = viewport.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const factor = Math.exp(-event.deltaY * 0.0015);
    zoomAround(x, y, scale * factor);
  }, { passive: false });

  viewport.addEventListener('dblclick', (event) => {
    if ((event.target as Element | null)?.closest('button, input, .modal, .bottom-controls, .hud-top')) return;
    const rect = viewport.getBoundingClientRect();
    zoomAround(event.clientX - rect.left, event.clientY - rect.top, scale * 1.5);
  });

  viewport.addEventListener('pointerdown', (event) => {
    if ((event.target as Element | null)?.closest('button, input, .modal, .bottom-controls, .hud-top')) return;
    const point = pointFromEvent(event);
    pointers.set(event.pointerId, point);
    viewport.setPointerCapture(event.pointerId);

    if (pointers.size === 1) {
      draggingPointer = event.pointerId;
      lastPointer = point;
      canvas.classList.add('camera-dragging');
    } else if (pointers.size === 2) {
      draggingPointer = null;
      const [a, b] = [...pointers.values()];
      pinchStartDistance = Math.hypot(b.x - a.x, b.y - a.y);
      pinchStartScale = scale;
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      pinchWorldAnchor = screenPointToWrappedWorld(midX, midY);
    }
  });

  viewport.addEventListener('pointermove', (event) => {
    if (!pointers.has(event.pointerId)) return;
    const point = pointFromEvent(event);
    pointers.set(event.pointerId, point);

    if (pointers.size === 1 && draggingPointer === event.pointerId) {
      offsetX += point.x - lastPointer.x;
      offsetY += point.y - lastPointer.y;
      lastPointer = point;
      applyCamera();
      return;
    }

    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const distance = Math.hypot(b.x - a.x, b.y - a.y);
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      scale = Math.max(minScale, Math.min(minScale * MAX_ZOOM_MULTIPLIER, pinchStartScale * distance / Math.max(1, pinchStartDistance)));
      offsetX = midX - pinchWorldAnchor.x * scale;
      offsetY = midY - pinchWorldAnchor.y * scale;
      applyCamera();
    }
  });

  function endPointer(event: PointerEvent) {
    pointers.delete(event.pointerId);
    if (draggingPointer === event.pointerId) draggingPointer = null;
    if (pointers.size === 1) {
      const [remainingId, point] = [...pointers.entries()][0];
      draggingPointer = remainingId;
      lastPointer = point;
    }
    if (pointers.size < 2) {
      pinchStartDistance = 0;
      canvas.classList.toggle('camera-dragging', pointers.size > 0);
    }
  }

  viewport.addEventListener('pointerup', endPointer);
  viewport.addEventListener('pointercancel', endPointer);

  window.addEventListener('resize', () => {
    const oldMin = minScale;
    const { width } = viewportSize();
    minScale = width / WORLD_MAP_WIDTH;
    if (scale < minScale) scale = minScale;
    else if (Math.abs(scale - oldMin) < 0.001) scale = minScale * INITIAL_ZOOM_MULTIPLIER;
    applyCamera();
  });

  const observer = new ResizeObserver(() => applyCamera());
  observer.observe(viewport);

  function mirrorFrame() {
    syncWrapTiles();
    requestAnimationFrame(mirrorFrame);
  }

  resetCamera();
  requestAnimationFrame(mirrorFrame);
}
