import './map-labels.css';
import { project } from './world/coordinates';
import { virtualWorldPoint, visibleWorldRange } from './world-wrap';
import { isWorldPointExplored } from './exploration';
import { currentCorridors } from './world/current-corridors';

type Geo = { lat: number; lon: number };
type Camera = { x: number; y: number; scale: number; zoomMultiplier?: number };
type LabelKind = 'mission' | 'city' | 'port' | 'island' | 'cape' | 'sea' | 'strait' | 'current';
type MapLabel = Geo & {
  name: string;
  kind: LabelKind;
  minZoom: number;
  priority: number;
};

const viewport = document.querySelector<HTMLElement>('.game-shell')!;

if (viewport) {
  const layer = document.createElement('canvas');
  layer.className = 'map-label-layer';
  layer.setAttribute('aria-hidden', 'true');
  viewport.append(layer);
  const ctx = layer.getContext('2d')!;

  const labels: MapLabel[] = [
    // Campaign and tutorial anchors. These are intentionally always the highest-priority labels.
    { name: 'San Sebastián', lat: 43.3183, lon: -1.9812, kind: 'mission', minZoom: 8, priority: 100 },
    { name: 'A Coruña', lat: 43.3623, lon: -8.4115, kind: 'mission', minZoom: 8, priority: 100 },
    { name: 'La Gomera', lat: 28.0916, lon: -17.1133, kind: 'mission', minZoom: 6, priority: 100 },
    { name: 'Annobón / San Mateo', lat: -1.434, lon: 5.632, kind: 'mission', minZoom: 6, priority: 100 },
    { name: 'Cape Frio', lat: -22.98, lon: -42.02, kind: 'mission', minZoom: 7, priority: 100 },
    { name: 'Río Santa Cruz', lat: -50.02, lon: -68.53, kind: 'mission', minZoom: 7, priority: 100 },
    { name: 'Río Gallegos', lat: -51.62, lon: -69.22, kind: 'mission', minZoom: 10, priority: 100 },
    { name: 'Cape Virgenes', lat: -52.33, lon: -68.35, kind: 'mission', minZoom: 10, priority: 100 },
    { name: 'Cape Pillar', lat: -52.72, lon: -74.67, kind: 'mission', minZoom: 10, priority: 100 },
    { name: 'Maloelap / San Bartolomé', lat: 8.77, lon: 171.03, kind: 'mission', minZoom: 7, priority: 100 },
    { name: 'Guam', lat: 13.4443, lon: 144.7937, kind: 'mission', minZoom: 7, priority: 100 },
    { name: 'Mindanao', lat: 8.0, lon: 125.0, kind: 'mission', minZoom: 7, priority: 100 },
    { name: 'Cebu', lat: 10.3157, lon: 123.8854, kind: 'mission', minZoom: 9, priority: 100 },
    { name: 'Talao / Celebes', lat: 2.75, lon: 125.37, kind: 'mission', minZoom: 10, priority: 100 },
    { name: 'Gilolo / Halmahera', lat: 1.2, lon: 127.9, kind: 'mission', minZoom: 10, priority: 100 },
    { name: 'Zamaso', lat: 1.05, lon: 127.65, kind: 'mission', minZoom: 16, priority: 100 },
    { name: 'Tidore', lat: 0.683, lon: 127.4, kind: 'mission', minZoom: 12, priority: 100 },

    // Iberia and Atlantic ports useful around the opening legs.
    { name: 'Bilbao', lat: 43.263, lon: -2.935, kind: 'port', minZoom: 30, priority: 55 },
    { name: 'Santander', lat: 43.462, lon: -3.81, kind: 'port', minZoom: 30, priority: 55 },
    { name: 'Gijón', lat: 43.545, lon: -5.662, kind: 'port', minZoom: 30, priority: 55 },
    { name: 'Vigo', lat: 42.24, lon: -8.72, kind: 'port', minZoom: 28, priority: 60 },
    { name: 'Lisbon', lat: 38.7223, lon: -9.1393, kind: 'city', minZoom: 18, priority: 65 },
    { name: 'Cádiz', lat: 36.5298, lon: -6.292, kind: 'port', minZoom: 22, priority: 60 },
    { name: 'Madeira', lat: 32.75, lon: -16.98, kind: 'island', minZoom: 16, priority: 50 },
    { name: 'Canary Islands', lat: 28.3, lon: -16.5, kind: 'island', minZoom: 10, priority: 45 },
    { name: 'Tenerife', lat: 28.29, lon: -16.63, kind: 'island', minZoom: 30, priority: 45 },
    { name: 'Gran Canaria', lat: 28.1, lon: -15.6, kind: 'island', minZoom: 30, priority: 45 },
    { name: 'Cape Verde', lat: 16.0, lon: -24.0, kind: 'island', minZoom: 14, priority: 48 },
    { name: 'Dakar', lat: 14.7167, lon: -17.4677, kind: 'port', minZoom: 22, priority: 50 },
    { name: 'Sierra Leone', lat: 8.5, lon: -11.8, kind: 'city', minZoom: 18, priority: 42 },
    { name: 'São Tomé', lat: 0.3365, lon: 6.7273, kind: 'island', minZoom: 18, priority: 48 },

    // Brazil and Patagonia.
    { name: 'Rio de Janeiro', lat: -22.9068, lon: -43.1729, kind: 'port', minZoom: 16, priority: 65 },
    { name: 'Santos', lat: -23.96, lon: -46.33, kind: 'port', minZoom: 28, priority: 48 },
    { name: 'Montevideo', lat: -34.9011, lon: -56.1645, kind: 'port', minZoom: 18, priority: 60 },
    { name: 'Buenos Aires', lat: -34.6037, lon: -58.3816, kind: 'city', minZoom: 18, priority: 62 },
    { name: 'Puerto Madryn', lat: -42.769, lon: -65.0385, kind: 'port', minZoom: 26, priority: 46 },
    { name: 'Falkland Islands', lat: -51.7, lon: -59.2, kind: 'island', minZoom: 16, priority: 42 },
    { name: 'Tierra del Fuego', lat: -54.2, lon: -68.5, kind: 'island', minZoom: 14, priority: 48 },
    { name: 'Punta Arenas', lat: -53.1638, lon: -70.9171, kind: 'port', minZoom: 22, priority: 58 },
    { name: 'Ushuaia', lat: -54.8019, lon: -68.303, kind: 'port', minZoom: 24, priority: 52 },
    { name: 'Strait of Magellan', lat: -53.3, lon: -72.0, kind: 'strait', minZoom: 8, priority: 70 },

    // Pacific islands and western Pacific navigation landmarks.
    { name: 'Easter Island', lat: -27.1127, lon: -109.3497, kind: 'island', minZoom: 14, priority: 44 },
    { name: 'Marquesas Islands', lat: -9.45, lon: -139.4, kind: 'island', minZoom: 14, priority: 44 },
    { name: 'Hawaiian Islands', lat: 20.5, lon: -157.5, kind: 'island', minZoom: 12, priority: 44 },
    { name: 'Marshall Islands', lat: 7.1, lon: 171.2, kind: 'island', minZoom: 9, priority: 58 },
    { name: 'Majuro', lat: 7.1164, lon: 171.1858, kind: 'port', minZoom: 26, priority: 48 },
    { name: 'Mariana Islands', lat: 15.2, lon: 145.75, kind: 'island', minZoom: 10, priority: 52 },
    { name: 'Saipan', lat: 15.1778, lon: 145.7509, kind: 'island', minZoom: 28, priority: 42 },

    // Philippines, Celebes and Moluccas — intentionally denser because many missions occur here.
    { name: 'Luzon', lat: 16.0, lon: 121.0, kind: 'island', minZoom: 15, priority: 44 },
    { name: 'Manila', lat: 14.5995, lon: 120.9842, kind: 'port', minZoom: 20, priority: 58 },
    { name: 'Samar', lat: 12.0, lon: 125.0, kind: 'island', minZoom: 22, priority: 42 },
    { name: 'Leyte', lat: 10.9, lon: 124.8, kind: 'island', minZoom: 24, priority: 42 },
    { name: 'Bohol', lat: 9.85, lon: 124.14, kind: 'island', minZoom: 28, priority: 40 },
    { name: 'Negros', lat: 10.0, lon: 123.0, kind: 'island', minZoom: 26, priority: 40 },
    { name: 'Panay', lat: 11.15, lon: 122.5, kind: 'island', minZoom: 26, priority: 40 },
    { name: 'Davao', lat: 7.0731, lon: 125.6128, kind: 'port', minZoom: 22, priority: 52 },
    { name: 'Zamboanga', lat: 6.9214, lon: 122.079, kind: 'port', minZoom: 24, priority: 50 },
    { name: 'Celebes / Sulawesi', lat: -2.0, lon: 121.0, kind: 'island', minZoom: 12, priority: 55 },
    { name: 'Manado', lat: 1.4748, lon: 124.8421, kind: 'port', minZoom: 22, priority: 52 },
    { name: 'Sangihe Islands', lat: 3.5, lon: 125.5, kind: 'island', minZoom: 22, priority: 42 },
    { name: 'Halmahera', lat: 1.0, lon: 128.0, kind: 'island', minZoom: 14, priority: 58 },
    { name: 'Ternate', lat: 0.7906, lon: 127.3842, kind: 'port', minZoom: 20, priority: 62 },
    { name: 'Bacan', lat: -0.65, lon: 127.5, kind: 'island', minZoom: 24, priority: 44 },
    { name: 'Molucca Sea', lat: 0.0, lon: 125.8, kind: 'sea', minZoom: 12, priority: 38 },
    { name: 'Moluccas / Spice Islands', lat: 0.5, lon: 127.0, kind: 'island', minZoom: 9, priority: 64 },

    // Broad sea labels provide orientation at lower zoom levels.
    { name: 'Bay of Biscay', lat: 45.2, lon: -5.0, kind: 'sea', minZoom: 5, priority: 30 },
    { name: 'North Atlantic Ocean', lat: 29.0, lon: -40.0, kind: 'sea', minZoom: 3, priority: 20 },
    { name: 'South Atlantic Ocean', lat: -25.0, lon: -20.0, kind: 'sea', minZoom: 3, priority: 20 },
    { name: 'Pacific Ocean', lat: -5.0, lon: -150.0, kind: 'sea', minZoom: 3, priority: 20 },
    { name: 'Philippine Sea', lat: 17.0, lon: 132.0, kind: 'sea', minZoom: 8, priority: 25 },
  ];

  const corridorLabels: MapLabel[] = currentCorridors.map(({ name, lat, lon, minZoom }) => ({ name, lat, lon, minZoom, priority: 36, kind: 'current' }));
  const corridorIsKnown = (name: string) => currentCorridors.find((corridor) => corridor.name === name)?.revealPoints.some((point) => isWorldPointExplored(project(point))) ?? false;

  let camera: Camera = { x: 0, y: 0, scale: 1, zoomMultiplier: 1 };

  function resize() {
    const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    layer.width = Math.max(1, Math.round(width * dpr));
    layer.height = Math.max(1, Math.round(height * dpr));
    layer.style.width = `${width}px`;
    layer.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { width, height };
  }

  function nearestWrappedScreenPoint(point: { x: number; y: number }, width: number, height: number) {
    const range = visibleWorldRange(camera.x, camera.y, camera.scale, width, height);
    let best = { x: 0, y: 0, distance: Infinity };
    for (let row = range.minRow - 1; row <= range.maxRow + 1; row += 1) {
      for (let column = range.minColumn - 1; column <= range.maxColumn + 1; column += 1) {
        const virtual = virtualWorldPoint(point, column, row);
        const x = camera.x + virtual.x * camera.scale;
        const y = camera.y + virtual.y * camera.scale;
        const distance = Math.hypot(x - width / 2, y - height / 2);
        if (distance < best.distance) best = { x, y, distance };
      }
    }
    return best;
  }

  function overlaps(a: DOMRect, b: DOMRect, padding = 5) {
    return !(a.right + padding < b.left || a.left - padding > b.right || a.bottom + padding < b.top || a.top - padding > b.bottom);
  }

  function labelStyle(kind: LabelKind) {
    if (kind === 'mission') return { font: '600 12px system-ui, sans-serif', fill: 'rgba(255,245,211,.98)', dot: true };
    if (kind === 'city' || kind === 'port') return { font: '600 11px system-ui, sans-serif', fill: 'rgba(239,244,244,.92)', dot: true };
    if (kind === 'sea' || kind === 'strait') return { font: 'italic 11px system-ui, sans-serif', fill: 'rgba(185,217,230,.72)', dot: false };
    if (kind === 'current') return { font: 'italic 600 10px system-ui, sans-serif', fill: 'rgba(114,224,211,.88)', dot: false };
    return { font: '500 10.5px system-ui, sans-serif', fill: 'rgba(222,231,228,.82)', dot: kind === 'cape' };
  }

  function draw() {
    const { width, height } = resize();
    ctx.clearRect(0, 0, width, height);
    const zoom = camera.zoomMultiplier ?? 1;
    const placed: DOMRect[] = [];
    const candidates = [...labels, ...corridorLabels]
      .filter((label) => zoom >= label.minZoom)
      .filter((label) => label.kind !== 'current' || corridorIsKnown(label.name))
      .map((label) => ({ label, point: nearestWrappedScreenPoint(project(label), width, height) }))
      .filter(({ point }) => point.x > -100 && point.x < width + 100 && point.y > -50 && point.y < height + 50)
      .sort((a, b) => b.label.priority - a.label.priority);

    for (const { label, point } of candidates) {
      const style = labelStyle(label.kind);
      ctx.font = style.font;
      const metrics = ctx.measureText(label.name);
      const textWidth = metrics.width;
      const textHeight = label.kind === 'mission' ? 14 : 13;
      const offsetX = style.dot ? 7 : 0;
      const box = new DOMRect(point.x + offsetX - 2, point.y - textHeight / 2 - 2, textWidth + 4, textHeight + 4);
      if (placed.some((other) => overlaps(box, other))) continue;
      placed.push(box);

      ctx.save();
      ctx.font = style.font;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.lineWidth = label.kind === 'mission' ? 4 : 3;
      ctx.strokeStyle = 'rgba(3,14,21,.88)';
      ctx.strokeText(label.name, point.x + offsetX, point.y);
      ctx.fillStyle = style.fill;
      ctx.fillText(label.name, point.x + offsetX, point.y);

      if (style.dot) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, label.kind === 'mission' ? 3.2 : 2.2, 0, Math.PI * 2);
        ctx.fillStyle = label.kind === 'mission' ? 'rgba(240,189,69,.98)' : 'rgba(229,238,239,.88)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(3,14,21,.8)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  window.addEventListener('elcano:camera-change', (event) => {
    const detail = (event as CustomEvent<Camera>).detail;
    if (!detail) return;
    camera = detail;
    requestAnimationFrame(draw);
  });

  new ResizeObserver(() => requestAnimationFrame(draw)).observe(viewport);
  draw();
}
