import './route-planning.css';
import { greatCircleDistanceNm, project, unproject, WORLD_MAP_HEIGHT, WORLD_MAP_WIDTH, type GeoPosition } from './world/coordinates';
import { isPolarRow, virtualWorldPoint, visibleWorldRange } from './world-wrap';

let planning = false;
let following = false;
let waypoints: GeoPosition[] = [];
let activeWaypoint = 0;
let previousTimeScale = 1;
let camera = { x: 0, y: 0, scale: 1 };
let lastShipPosition: GeoPosition | null = null;
let pointerStart: { id: number; x: number; y: number } | null = null;
let overlay: SVGSVGElement | null = null;
let routeButton: HTMLButtonElement | null = null;

function normalizeHeading(value: number) { return ((value % 360) + 360) % 360; }
function positiveModulo(value: number, modulus: number) { return ((value % modulus) + modulus) % modulus; }

function bearingTo(from: GeoPosition, to: GeoPosition) {
  const lat1 = from.lat * Math.PI / 180;
  const lat2 = to.lat * Math.PI / 180;
  const dLon = ((to.lon - from.lon + 540) % 360 - 180) * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return normalizeHeading(Math.atan2(y, x) * 180 / Math.PI);
}

function currentTimeScale() {
  const active = document.querySelector<HTMLButtonElement>('.time-button.active');
  return Number(active?.dataset.time ?? 1) || 1;
}

function pauseTime() {
  previousTimeScale = currentTimeScale();
  document.querySelector<HTMLButtonElement>('.time-button[data-time="0"]')?.click();
}

function resumeTime() {
  const wanted = previousTimeScale > 0 ? previousTimeScale : 1;
  document.querySelector<HTMLButtonElement>(`.time-button[data-time="${wanted}"]`)?.click()
    ?? document.querySelector<HTMLButtonElement>('.time-button[data-time="1"]')?.click();
}

function updateButton() {
  if (!routeButton) return;
  routeButton.classList.toggle('active', planning || following);
  routeButton.setAttribute('aria-pressed', String(planning || following));
  routeButton.title = planning ? 'Start route' : following ? 'Edit route' : 'Plan route';
  routeButton.setAttribute('aria-label', routeButton.title);
}

function startPlanning() {
  planning = true;
  following = false;
  pauseTime();
  document.querySelector('.game-shell')?.classList.add('route-planning');
  updateButton();
  renderOverlay();
}

function finishPlanning() {
  planning = false;
  document.querySelector('.game-shell')?.classList.remove('route-planning');
  if (waypoints.length === 0) {
    following = false;
    updateButton();
    return;
  }
  if (activeWaypoint >= waypoints.length) activeWaypoint = 0;
  following = true;
  updateButton();
  resumeTime();
}

function togglePlanning() {
  if (planning) finishPlanning();
  else startPlanning();
}

function screenToGeo(screenX: number, screenY: number) {
  const virtualX = (screenX - camera.x) / camera.scale;
  const virtualY = (screenY - camera.y) / camera.scale;
  const row = Math.floor(virtualY / WORLD_MAP_HEIGHT);
  const polar = isPolarRow(row);
  const baseY = polar ? (row + 1) * WORLD_MAP_HEIGHT - virtualY : virtualY - row * WORLD_MAP_HEIGHT;
  const baseX = positiveModulo(virtualX - (polar ? WORLD_MAP_WIDTH / 2 : 0), WORLD_MAP_WIDTH);
  return unproject({ x: baseX, y: Math.max(0, Math.min(WORLD_MAP_HEIGHT, baseY)) });
}

function nearestWrappedScreenPoint(position: GeoPosition) {
  const shell = document.querySelector<HTMLElement>('.game-shell');
  if (!shell) return null;
  const point = project(position);
  const range = visibleWorldRange(camera.x, camera.y, camera.scale, shell.clientWidth, shell.clientHeight);
  let best: { x: number; y: number; distance: number } | null = null;
  for (let row = range.minRow - 1; row <= range.maxRow + 1; row += 1) {
    for (let column = range.minColumn - 1; column <= range.maxColumn + 1; column += 1) {
      const virtual = virtualWorldPoint(point, column, row);
      const x = camera.x + virtual.x * camera.scale;
      const y = camera.y + virtual.y * camera.scale;
      const distance = Math.hypot(x - shell.clientWidth / 2, y - shell.clientHeight / 2);
      if (!best || distance < best.distance) best = { x, y, distance };
    }
  }
  return best;
}

function renderOverlay() {
  if (!overlay) return;
  const points: Array<{ x: number; y: number }> = [];
  if (lastShipPosition && following) {
    const ship = nearestWrappedScreenPoint(lastShipPosition);
    if (ship) points.push(ship);
  }
  for (let index = activeWaypoint; index < waypoints.length; index += 1) {
    const point = nearestWrappedScreenPoint(waypoints[index]);
    if (point) points.push(point);
  }

  const path = points.length > 1 ? `<polyline class="route-line" points="${points.map(p => `${p.x},${p.y}`).join(' ')}"/>` : '';
  const markers = waypoints.map((waypoint, index) => {
    const point = nearestWrappedScreenPoint(waypoint);
    if (!point) return '';
    const done = index < activeWaypoint;
    return `<g opacity="${done ? '.38' : '1'}"><circle class="route-waypoint" cx="${point.x}" cy="${point.y}" r="8"/><text class="route-waypoint-label" x="${point.x}" y="${point.y + 4}">${index + 1}</text></g>`;
  }).join('');
  overlay.innerHTML = path + markers;
}

function addWaypoint(position: GeoPosition) {
  if (waypoints.length >= 30) return;
  waypoints.push(position);
  if (!following) activeWaypoint = 0;
  renderOverlay();
}

export function routeHeading(position: GeoPosition): number | null {
  lastShipPosition = position;
  if (!following || activeWaypoint >= waypoints.length) {
    if (following && activeWaypoint >= waypoints.length) {
      following = false;
      updateButton();
    }
    renderOverlay();
    return null;
  }

  while (activeWaypoint < waypoints.length && greatCircleDistanceNm(position, waypoints[activeWaypoint]) <= 1.25) {
    activeWaypoint += 1;
  }
  if (activeWaypoint >= waypoints.length) {
    following = false;
    updateButton();
    renderOverlay();
    return null;
  }
  renderOverlay();
  return bearingTo(position, waypoints[activeWaypoint]);
}

export function resetRoute() {
  planning = false;
  following = false;
  waypoints = [];
  activeWaypoint = 0;
  lastShipPosition = null;
  document.querySelector('.game-shell')?.classList.remove('route-planning');
  updateButton();
  renderOverlay();
}

function install() {
  const shell = document.querySelector<HTMLElement>('.game-shell');
  const actions = document.querySelector<HTMLElement>('.top-actions');
  if (!shell || !actions) { requestAnimationFrame(install); return; }
  if (document.querySelector('#route-plan')) return;

  routeButton = document.createElement('button');
  routeButton.id = 'route-plan';
  routeButton.className = 'icon-button route-plan-button';
  routeButton.textContent = '🗺️';
  routeButton.setAttribute('aria-label', 'Plan route');
  routeButton.setAttribute('aria-pressed', 'false');
  routeButton.title = 'Plan route';
  actions.insertBefore(routeButton, actions.firstChild);
  routeButton.addEventListener('click', togglePlanning);

  overlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  overlay.classList.add('route-overlay');
  overlay.setAttribute('aria-hidden', 'true');
  shell.append(overlay);

  window.addEventListener('elcano:camera-change', event => {
    const detail = (event as CustomEvent<{ x: number; y: number; scale: number }>).detail;
    if (!detail) return;
    camera = { x: detail.x, y: detail.y, scale: detail.scale };
    renderOverlay();
  });

  shell.addEventListener('pointerdown', event => {
    if (!planning) return;
    if ((event.target as Element | null)?.closest('button, input, .modal, .bottom-controls, .hud-top, #coastal-controls')) return;
    const rect = shell.getBoundingClientRect();
    pointerStart = { id: event.pointerId, x: event.clientX - rect.left, y: event.clientY - rect.top };
    event.preventDefault();
    event.stopPropagation();
  }, true);

  shell.addEventListener('pointerup', event => {
    if (!planning || !pointerStart || pointerStart.id !== event.pointerId) return;
    const rect = shell.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (Math.hypot(x - pointerStart.x, y - pointerStart.y) <= 10) addWaypoint(screenToGeo(x, y));
    pointerStart = null;
    event.preventDefault();
    event.stopPropagation();
  }, true);

  window.addEventListener('elcano:route-reset', resetRoute);
  updateButton();
}

if (typeof window !== 'undefined') requestAnimationFrame(install);
