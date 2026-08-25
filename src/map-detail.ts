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
  let camera: CameraDetail | null = null;
  let detailedRenderer: ((ctx: CanvasRenderingContext2D, screenScale: number) => void) | null = null;
  let loading = false;
  const DETAIL_ZOOM = 18;

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

  async function ensureDetailedRenderer() {
    if (detailedRenderer || loading) return;
    loading = true;
    try {
      const module = await import('./world/geography-detail');
      detailedRenderer = module.drawDetailedCoastline;
    } finally {
      loading = false;
    }
    render();
  }

  function render() {
    if (!ctx) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, viewport.clientWidth, viewport.clientHeight);
    if (!camera || camera.zoomMultiplier < DETAIL_ZOOM) return;

    if (!detailedRenderer) {
      void ensureDetailedRenderer();
      return;
    }

    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.scale, camera.scale);
    detailedRenderer(ctx, camera.scale);
    ctx.restore();
  }

  window.addEventListener('elcano:camera-change', (event) => {
    const detail = (event as CustomEvent<CameraDetail>).detail;
    if (!detail) return;
    camera = detail;
    render();
  });

  const resizeObserver = new ResizeObserver(() => {
    resize();
    render();
  });
  resizeObserver.observe(viewport);
  resize();
}
