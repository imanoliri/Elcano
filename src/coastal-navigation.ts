import './coastal-navigation.css';
import { offsetByNauticalMiles, type GeoPosition } from './world/coordinates';
import { isLand } from './world/geography';

export type WaterState = 'deep' | 'coastal' | 'aground';

const COASTAL_WATER_NM = 16;
const PROBE_BEARINGS = 32;
let anchored = false;
let lastWaterState: WaterState = 'coastal';

function positionAt(position: GeoPosition, bearingDeg: number, distanceNm: number) {
  const bearing = bearingDeg * Math.PI / 180;
  return offsetByNauticalMiles(position, Math.sin(bearing) * distanceNm, Math.cos(bearing) * distanceNm);
}

export function nearestLand(position: GeoPosition, maxDistanceNm = COASTAL_WATER_NM) {
  const step = maxDistanceNm > 8 ? 0.75 : 0.25;
  for (let distance = step; distance <= maxDistanceNm; distance += step) {
    for (let index = 0; index < PROBE_BEARINGS; index += 1) {
      const bearingDeg = index * 360 / PROBE_BEARINGS;
      if (isLand(positionAt(position, bearingDeg, distance))) return { distanceNm: distance, bearingDeg };
    }
  }
  return null;
}

export function waterStateAt(position: GeoPosition): WaterState {
  return nearestLand(position, COASTAL_WATER_NM) || isLand(position) ? 'coastal' : 'deep';
}

export function isAnchored() { return anchored; }

export function setAnchored(next: boolean) {
  anchored = next && lastWaterState === 'coastal';
  updateControls();
}

export function reportCoastalState(position: GeoPosition, collided = false) {
  lastWaterState = collided ? 'aground' : waterStateAt(position);
  if (lastWaterState !== 'coastal') anchored = false;
  window.dispatchEvent(new CustomEvent('elcano:coastal-state', { detail: { waterState: lastWaterState, anchored } }));
  updateControls();
}

export function resolveLandCollision(from: GeoPosition, to: GeoPosition) {
  if (!isLand(to)) return { position: to, collided: false };

  // The Natural Earth coastline is intentionally coarse. Some valid coastal
  // starting points can fall just inside a land polygon. Allow those positions
  // to move toward water rather than trapping the vessel immediately.
  if (isLand(from)) return { position: to, collided: false };

  let safe = from;
  let blocked = to;
  for (let index = 0; index < 14; index += 1) {
    const mid = { lat: (safe.lat + blocked.lat) / 2, lon: (safe.lon + blocked.lon) / 2 };
    if (isLand(mid)) blocked = mid;
    else safe = mid;
  }
  return { position: safe, collided: true };
}

function updateControls() {
  const panel = document.querySelector<HTMLElement>('#coastal-controls');
  if (!panel) return;
  const status = panel.querySelector<HTMLElement>('[data-coastal-status]');
  if (status) status.textContent = lastWaterState === 'deep' ? 'Deep water' : lastWaterState === 'coastal' ? 'Coastal water' : 'Aground';
  const anchor = panel.querySelector<HTMLButtonElement>('[data-anchor]');
  if (anchor) {
    anchor.hidden = lastWaterState !== 'coastal';
    anchor.classList.toggle('active', anchored);
    anchor.setAttribute('aria-pressed', String(anchored));
    anchor.setAttribute('aria-label', anchored ? 'Raise anchor' : 'Drop anchor');
    anchor.title = anchored ? 'Raise anchor' : 'Drop anchor';
  }
}

function installControls() {
  if (document.querySelector('#coastal-controls')) return;
  const shell = document.querySelector('.game-shell');
  if (!shell) { requestAnimationFrame(installControls); return; }

  const panel = document.createElement('section');
  panel.id = 'coastal-controls';
  panel.className = 'coastal-controls';
  panel.setAttribute('aria-label', 'Coastal status');
  panel.innerHTML = `<div class="coastal-status"><span>Water</span><strong data-coastal-status>Coastal water</strong></div><button class="anchor-button" data-anchor aria-label="Drop anchor" aria-pressed="false" title="Drop anchor">⚓</button>`;
  shell.append(panel);
  panel.querySelector<HTMLButtonElement>('[data-anchor]')!.addEventListener('click', () => setAnchored(!anchored));
  document.querySelector('#reset')?.addEventListener('click', () => setAnchored(false));
  updateControls();
}

if (typeof window !== 'undefined') requestAnimationFrame(installControls);
