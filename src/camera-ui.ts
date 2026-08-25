import './camera-ui.css';

const WORLD_WIDTH = 1000;
const WORLD_HEIGHT = 650;
const TARGET = { x: 650, y: 245 };

const canvas = document.querySelector<HTMLCanvasElement>('#ocean')!;
const viewport = document.querySelector<HTMLElement>('.game-shell')!;

if (canvas && viewport) {
  const indicator = document.createElement('div');
  indicator.className = 'target-edge-indicator';
  indicator.setAttribute('aria-hidden', 'true');
  viewport.append(indicator);

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

  function viewportSize() {
    return { width: viewport.clientWidth, height: viewport.clientHeight };
  }

  function clampCamera() {
    const { width, height } = viewportSize();
    const mapWidth = WORLD_WIDTH * scale;
    const mapHeight = WORLD_HEIGHT * scale;

    if (mapWidth <= width) {
      offsetX = (width - mapWidth) / 2;
    } else {
      offsetX = Math.min(0, Math.max(width - mapWidth, offsetX));
    }

    if (mapHeight <= height) {
      offsetY = (height - mapHeight) / 2;
    } else {
      offsetY = Math.min(0, Math.max(height - mapHeight, offsetY));
    }
  }

  function applyCamera() {
    clampCamera();
    canvas.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    updateTargetIndicator();
  }

  function resetCamera() {
    const { width } = viewportSize();
    minScale = width / WORLD_WIDTH;
    scale = minScale;
    offsetX = 0;
    offsetY = 0;
    applyCamera();
  }

  function zoomAround(screenX: number, screenY: number, nextScale: number) {
    const clampedScale = Math.max(minScale, Math.min(minScale * 5, nextScale));
    const worldX = (screenX - offsetX) / scale;
    const worldY = (screenY - offsetY) / scale;
    scale = clampedScale;
    offsetX = screenX - worldX * scale;
    offsetY = screenY - worldY * scale;
    applyCamera();
  }

  function updateTargetIndicator() {
    const { width, height } = viewportSize();
    const x = offsetX + TARGET.x * scale;
    const y = offsetY + TARGET.y * scale;
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

  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const rect = viewport.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const factor = Math.exp(-event.deltaY * 0.0015);
    zoomAround(x, y, scale * factor);
  }, { passive: false });

  canvas.addEventListener('dblclick', (event) => {
    const rect = viewport.getBoundingClientRect();
    zoomAround(event.clientX - rect.left, event.clientY - rect.top, scale * 1.5);
  });

  canvas.addEventListener('pointerdown', (event) => {
    const point = pointFromEvent(event);
    pointers.set(event.pointerId, point);
    canvas.setPointerCapture(event.pointerId);

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
      pinchWorldAnchor = {
        x: (midX - offsetX) / scale,
        y: (midY - offsetY) / scale,
      };
    }
  });

  canvas.addEventListener('pointermove', (event) => {
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
      scale = Math.max(minScale, Math.min(minScale * 5, pinchStartScale * distance / Math.max(1, pinchStartDistance)));
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

  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);

  window.addEventListener('resize', () => {
    const oldMin = minScale;
    const { width } = viewportSize();
    minScale = width / WORLD_WIDTH;
    if (Math.abs(scale - oldMin) < 0.001) scale = minScale;
    else scale = Math.max(minScale, scale);
    applyCamera();
  });

  const observer = new ResizeObserver(() => applyCamera());
  observer.observe(viewport);

  resetCamera();
}
