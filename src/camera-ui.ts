import './camera-ui.css';
import { WORLD_MAP_HEIGHT, WORLD_MAP_WIDTH } from './world/coordinates';
import { isPolarRow, virtualWorldPoint, visibleWorldRange } from './world-wrap';

const canvas = document.querySelector<HTMLCanvasElement>('#ocean')!;
const viewport = document.querySelector<HTMLElement>('.game-shell')!;

if (canvas && viewport) {
  const indicator = document.createElement('div');
  indicator.className = 'target-edge-indicator';
  indicator.setAttribute('aria-hidden', 'true');
  viewport.append(indicator);

  const wrapLayer = document.createElement('canvas');
  wrapLayer.className = 'world-wrap-layer';
  wrapLayer.setAttribute('aria-hidden', 'true');
  canvas.insertAdjacentElement('afterend', wrapLayer);
  const wrapCtx = wrapLayer.getContext('2d')!;

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
  // Same geographic center as before (43.3513°N, 5.2°W), reprojected for
  // the pole-complete equirectangular chart.
  const tutorialCenter = { x: 699.2, y: 186.595 };
  const INITIAL_ZOOM_MULTIPLIER = 50;
  const MAX_ZOOM_MULTIPLIER = 256;

  canvas.style.width = `${WORLD_MAP_WIDTH}px`;
  canvas.style.height = `${WORLD_MAP_HEIGHT}px`;
  canvas.style.opacity = '0';

  function viewportSize() {
    return { width: viewport.clientWidth, height: viewport.clientHeight };
  }

  function positiveModulo(value: number, modulus: number) {
    return ((value % modulus) + modulus) % modulus;
  }

  function normalizeCamera() {
    const mapWidth = WORLD_MAP_WIDTH * scale;
    const globeHeightPeriod = WORLD_MAP_HEIGHT * scale * 2;
    offsetX = -positiveModulo(-offsetX, mapWidth);
    offsetY = -positiveModulo(-offsetY, globeHeightPeriod);
  }

  function resizeWrapLayer() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const { width, height } = viewportSize();
    const pixelWidth = Math.max(1, Math.round(width * dpr));
    const pixelHeight = Math.max(1, Math.round(height * dpr));
    if (wrapLayer.width !== pixelWidth || wrapLayer.height !== pixelHeight) {
      wrapLayer.width = pixelWidth;
      wrapLayer.height = pixelHeight;
      wrapLayer.style.width = `${width}px`;
      wrapLayer.style.height = `${height}px`;
    }
    wrapCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawWorldTile(column: number, row: number) {
    const dx = offsetX + column * WORLD_MAP_WIDTH * scale;
    const dy = offsetY + row * WORLD_MAP_HEIGHT * scale;
    const dw = WORLD_MAP_WIDTH * scale;
    const dh = WORLD_MAP_HEIGHT * scale;

    if (!isPolarRow(row)) {
      wrapCtx.drawImage(canvas, 0, 0, WORLD_MAP_WIDTH, WORLD_MAP_HEIGHT, dx, dy, dw, dh);
      return;
    }

    // On a pole-complete equirectangular chart, crossing either pole reflects
    // latitude and rotates longitude by 180°. Split at the antimeridian so the
    // half-world longitude shift stays continuous inside the reflected row.
    wrapCtx.save();
    wrapCtx.translate(dx, dy + dh);
    wrapCtx.scale(1, -1);
    wrapCtx.drawImage(canvas, WORLD_MAP_WIDTH / 2, 0, WORLD_MAP_WIDTH / 2, WORLD_MAP_HEIGHT, 0, 0, dw / 2, dh);
    wrapCtx.drawImage(canvas, 0, 0, WORLD_MAP_WIDTH / 2, WORLD_MAP_HEIGHT, dw / 2, 0, dw / 2, dh);
    wrapCtx.restore();
  }

  function renderWrappedWorld() {
    resizeWrapLayer();
    const { width, height } = viewportSize();
    wrapCtx.clearRect(0, 0, width, height);
    const range = visibleWorldRange(offsetX, offsetY, scale, width, height);
    for (let row = range.minRow; row <= range.maxRow; row += 1) {
      for (let column = range.minColumn; column <= range.maxColumn; column += 1) {
        drawWorldTile(column, row);
      }
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
    renderWrappedWorld();
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
    const range = visibleWorldRange(offsetX, offsetY, scale, width, height);
    let best = { x: 0, y: 0, distance: Infinity };
    for (let row = range.minRow - 1; row <= range.maxRow + 1; row += 1) {
      for (let column = range.minColumn - 1; column <= range.maxColumn + 1; column += 1) {
        const virtual = virtualWorldPoint(point, column, row);
        const x = offsetX + virtual.x * scale;
        const y = offsetY + virtual.y * scale;
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

  function screenPointToVirtualWorld(screenX: number, screenY: number) {
    return {
      x: (screenX - offsetX) / scale,
      y: (screenY - offsetY) / scale,
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
      pinchWorldAnchor = screenPointToVirtualWorld(midX, midY);
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
    renderWrappedWorld();
    requestAnimationFrame(mirrorFrame);
  }

  resetCamera();
  requestAnimationFrame(mirrorFrame);
}
