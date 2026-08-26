import './map-detail.css';

const ocean = document.querySelector<HTMLCanvasElement>('#ocean');
const shell = document.querySelector<HTMLElement>('.game-shell');

if (ocean && shell) {
  const mapCanvas = ocean;
  const viewport = shell;
  const overlay = document.createElement('canvas');
  overlay.id = 'map-detail-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  mapCanvas.insertAdjacentElement('afterend', overlay);

  const ctx = overlay.getContext('2d');
  type CameraDetail = { x: number; y: number; scale: number; zoomMultiplier: number };
  type WorldBounds = { minX: number; minY: number; maxX: number; maxY: number };
  type DetailedRenderer = (ctx: CanvasRenderingContext2D, screenScale: number, visibleBounds: WorldBounds) => void;
  let camera: CameraDetail | null = null;
  let detailedRenderer: DetailedRenderer | null = null;
  let loading = false;
  let settleTimer = 0;
  const DETAIL_ZOOM = 10;
  const CAMERA_SETTLE_MS = 70;

  function resize() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const width = Math.max(1, viewport.clientWidth);
    const height = Math.max(1, viewport.clientHeight);
    overlay.width = Math.round(width * dpr);
    overlay.height = Math.round(height * dpr);
    overlay.style.width = `${width}px`;
    overlay.style.height = `${height}px`;
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function clear() {
    if (!ctx) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, viewport.clientWidth, viewport.clientHeight);
  }

  async function ensureDetailedRenderer() {
    if (detailedRenderer || loading) return;
    loading = true;
    try {
      const module = await import('./world/geography-detail');
      detailedRenderer = module.drawDetailedCoastline;
    } finally {
      loading = false;
    }
    scheduleSettledRender(0);
  }

  function visibleWorldBounds(value: CameraDetail): WorldBounds {
    const padding = 12 / Math.max(0.01, value.scale);
    return {
      minX: -value.x / value.scale - padding,
      minY: -value.y / value.scale - padding,
      maxX: (viewport.clientWidth - value.x) / value.scale + padding,
      maxY: (viewport.clientHeight - value.y) / value.scale + padding,
    };
  }

  function render() {
    clear();
    if (!ctx || !camera || camera.zoomMultiplier < DETAIL_ZOOM) return;

    if (!detailedRenderer) {
      void ensureDetailedRenderer();
      return;
    }

    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.scale, camera.scale);
    detailedRenderer(ctx, camera.scale, visibleWorldBounds(camera));
    ctx.restore();
  }

  function scheduleSettledRender(delay = CAMERA_SETTLE_MS) {
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => requestAnimationFrame(render), delay);
  }

  window.addEventListener('elcano:camera-change', (event) => {
    const detail = (event as CustomEvent<CameraDetail>).detail;
    if (!detail) return;
    camera = detail;

    // Keep gesture frames cheap: the 50m base map is already being transformed
    // by the browser. Hide stale detail while moving, then redraw the 10m LOD
    // once the camera settles instead of rebuilding it on every pointer frame.
    clear();
    if (camera.zoomMultiplier >= DETAIL_ZOOM && !detailedRenderer) void ensureDetailedRenderer();
    scheduleSettledRender();
  });

  const resizeObserver = new ResizeObserver(() => {
    resize();
    scheduleSettledRender(0);
  });
  resizeObserver.observe(viewport);
  resize();
}
