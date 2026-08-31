import './camera-ui.css';
import { missionFromUrl } from './missions';
import { project, WORLD_MAP_HEIGHT, WORLD_MAP_WIDTH } from './world/coordinates';
import { virtualWorldPoint, visibleWorldRange } from './world-wrap';

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
  const wrapCtx = wrapLayer.getContext('2d', { alpha: false })!;

  const topActions = document.querySelector<HTMLElement>('.top-actions');
  const cameraModeButton = document.createElement('button');
  cameraModeButton.type = 'button';
  cameraModeButton.className = 'icon-button camera-mode-button';
  if (topActions) topActions.prepend(cameraModeButton);

  type CameraMode = 'static' | 'follow';
  let cameraMode: CameraMode = 'static';
  let shipPoint = project(missionFromUrl().start);
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
  let cameraDirty = true;
  let lastSourceRefresh = 0;

  // Each mission opens over its own starting position. Previously this was a
  // hard-coded Bay of Biscay point, so every mission visually opened at the
  // tutorial even though the ship state had correctly moved elsewhere.
  const initialCenter = shipPoint;
  const INITIAL_ZOOM_MULTIPLIER = 50;
  // The map source is a fixed-resolution canvas. A multiplier of 50 is useful
  // on a phone, but turns into a very soft 30–40× interpolation on a laptop.
  // Keep the automatic opening view below that visible blur threshold; players
  // can still deliberately zoom farther in when they need to inspect a coast.
  const MAX_CRISP_OPENING_SCALE = 8;
  // Strait and harbour approaches need considerably more chart detail than an
  // ocean crossing. The vector coastline overlay takes over at close range, so
  // permit a true close-pilotage view instead of stopping at the former limit.
  const MAX_ZOOM_MULTIPLIER = 1024;
  const MAX_WRAP_DPR = 2;
  const SOURCE_REFRESH_INTERVAL_MS = 50;

  canvas.style.width = `${WORLD_MAP_WIDTH}px`;
  canvas.style.height = `${WORLD_MAP_HEIGHT}px`;
  canvas.style.opacity = '0';

  function viewportSize() {
    return { width: viewport.clientWidth, height: viewport.clientHeight };
  }

  function renderDpr() {
    return Math.min(MAX_WRAP_DPR, Math.max(1, window.devicePixelRatio || 1));
  }

  function positiveModulo(value: number, modulus: number) {
    return ((value % modulus) + modulus) % modulus;
  }

  function normalizeCamera() {
    const mapWidth = WORLD_MAP_WIDTH * scale;
    const mapHeight = WORLD_MAP_HEIGHT * scale;
    const { height } = viewportSize();

    // Longitude repeats continuously at the antimeridian. Latitude does not:
    // keep the viewport inside the north/south chart bounds instead of
    // reflecting another copy of the world across each pole.
    offsetX = -positiveModulo(-offsetX, mapWidth);
    if (mapHeight <= height) offsetY = (height - mapHeight) / 2;
    else offsetY = Math.max(height - mapHeight, Math.min(0, offsetY));
  }

  function resizeWrapLayer() {
    const dpr = renderDpr();
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

  function drawWorldTile(column: number) {
    const dx = offsetX + column * WORLD_MAP_WIDTH * scale;
    const dy = offsetY;
    const dw = WORLD_MAP_WIDTH * scale;
    const dh = WORLD_MAP_HEIGHT * scale;
    wrapCtx.drawImage(canvas, 0, 0, WORLD_MAP_WIDTH, WORLD_MAP_HEIGHT, dx, dy, dw, dh);
  }

  function renderWrappedWorld() {
    resizeWrapLayer();
    const { width, height } = viewportSize();
    wrapCtx.clearRect(0, 0, width, height);
    const range = visibleWorldRange(offsetX, offsetY, scale, width, height);
    for (let column = range.minColumn; column <= range.maxColumn; column += 1) {
      drawWorldTile(column);
    }
  }

  function announceCamera() {
    const zoomMultiplier = scale / Math.max(0.0001, minScale);
    canvas.dataset.cameraScale = String(scale);
    canvas.dataset.zoomMultiplier = String(zoomMultiplier);
    window.dispatchEvent(new CustomEvent('elcano:camera-change', {
      detail: { x: offsetX, y: offsetY, scale, minScale, zoomMultiplier, mode: cameraMode, wrapped: true },
    }));
  }

  function applyCamera() {
    normalizeCamera();
    canvas.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    cameraDirty = true;
    announceCamera();
    updateTargetIndicator();
  }

  function resetCamera() {
    const { width } = viewportSize();
    minScale = width / WORLD_MAP_WIDTH;
    scale = Math.max(minScale, Math.min(minScale * INITIAL_ZOOM_MULTIPLIER, MAX_CRISP_OPENING_SCALE));
    offsetX = width / 2 - initialCenter.x * scale;
    offsetY = viewport.clientHeight / 2 - initialCenter.y * scale;
    applyCamera();
  }

  function zoomAround(screenX: number, screenY: number, nextScale: number) {
    const clampedScale = Math.max(minScale, Math.min(minScale * MAX_ZOOM_MULTIPLIER, nextScale));
    if (cameraMode === 'follow') {
      scale = clampedScale;
      centerOnPoint(shipPoint);
      return;
    }
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
    for (let column = range.minColumn - 1; column <= range.maxColumn + 1; column += 1) {
      const virtual = virtualWorldPoint(point, column);
      const x = offsetX + virtual.x * scale;
      const y = offsetY + virtual.y * scale;
      const distance = Math.hypot(x - width / 2, y - height / 2);
      if (distance < best.distance) best = { x, y, distance };
    }
    return best;
  }

  function centerOnPoint(point: { x: number; y: number }) {
    const { width, height } = viewportSize();
    const current = nearestWrappedScreenPoint(point);
    // The follow camera updates continuously. Leaving its canvas destination on
    // fractional physical pixels makes the browser interpolate every frame and
    // visibly softens coastlines on laptop displays. Keep the world on the
    // render canvas's physical-pixel grid; the ship remains centred to within
    // half a physical pixel.
    const dpr = renderDpr();
    offsetX = Math.round((offsetX + width / 2 - current.x) * dpr) / dpr;
    offsetY = Math.round((offsetY + height / 2 - current.y) * dpr) / dpr;
    applyCamera();
  }

  function setCameraMode(next: CameraMode) {
    cameraMode = next;
    cameraModeButton.classList.toggle('active', next === 'follow');
    cameraModeButton.textContent = next === 'static' ? '📌' : '⛵';
    cameraModeButton.title = next === 'static' ? 'Static camera · tap to follow ship' : 'Follow ship · tap for static camera';
    cameraModeButton.setAttribute('aria-label', next === 'static' ? 'Static camera. Tap to follow ship' : 'Follow ship camera. Tap for static camera');
    cameraModeButton.setAttribute('aria-pressed', String(next === 'follow'));
    viewport.dataset.cameraMode = next;
    if (next === 'follow') centerOnPoint(shipPoint);
  }

  cameraModeButton.addEventListener('click', () => {
    setCameraMode(cameraMode === 'static' ? 'follow' : 'static');
  });

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

  window.addEventListener('elcano:map-markers', (event) => {
    const detail = (event as CustomEvent<{ ship: { x: number; y: number } }>).detail;
    if (!detail?.ship) return;
    shipPoint = detail.ship;
    if (cameraMode === 'follow') centerOnPoint(shipPoint);
  });

  window.addEventListener('elcano:camera-zoom', (event) => {
    const factor = (event as CustomEvent<number>).detail;
    if (!Number.isFinite(factor) || factor <= 0) return;
    const { width, height } = viewportSize();
    zoomAround(width / 2, height / 2, scale * factor);
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
      draggingPointer = cameraMode === 'static' ? event.pointerId : null;
      lastPointer = point;
      canvas.classList.toggle('camera-dragging', draggingPointer !== null);
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
      if (cameraMode === 'follow') {
        centerOnPoint(shipPoint);
      } else {
        offsetX = midX - pinchWorldAnchor.x * scale;
        offsetY = midY - pinchWorldAnchor.y * scale;
        applyCamera();
      }
    }
  });

  function endPointer(event: PointerEvent) {
    pointers.delete(event.pointerId);
    if (draggingPointer === event.pointerId) draggingPointer = null;
    if (pointers.size === 1) {
      const [remainingId, point] = [...pointers.entries()][0];
      draggingPointer = cameraMode === 'static' ? remainingId : null;
      lastPointer = point;
    }
    if (pointers.size < 2) {
      pinchStartDistance = 0;
      canvas.classList.toggle('camera-dragging', pointers.size > 0 && draggingPointer !== null);
    }
  }

  viewport.addEventListener('pointerup', endPointer);
  viewport.addEventListener('pointercancel', endPointer);

  window.addEventListener('resize', () => {
    const oldMin = minScale;
    const { width } = viewportSize();
    minScale = width / WORLD_MAP_WIDTH;
    if (scale < minScale) scale = minScale;
    else if (Math.abs(scale - oldMin) < 0.001) scale = Math.min(minScale * INITIAL_ZOOM_MULTIPLIER, MAX_CRISP_OPENING_SCALE);
    if (cameraMode === 'follow') centerOnPoint(shipPoint);
    else applyCamera();
  });

  const observer = new ResizeObserver(() => {
    if (cameraMode === 'follow') centerOnPoint(shipPoint);
    else applyCamera();
  });
  observer.observe(viewport);

  function mirrorFrame(timestamp: number) {
    const sourceDue = timestamp - lastSourceRefresh >= SOURCE_REFRESH_INTERVAL_MS;
    if (cameraDirty || sourceDue) {
      renderWrappedWorld();
      cameraDirty = false;
      if (sourceDue) lastSourceRefresh = timestamp;
    }
    requestAnimationFrame(mirrorFrame);
  }

  resetCamera();
  setCameraMode('static');
  requestAnimationFrame(mirrorFrame);
}
