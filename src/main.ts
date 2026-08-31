import './style.css';
import {
  currentAt,
  distanceToDestination,
  maneuveringDriveVelocity,
  sailingVelocity,
  stepWorld,
  setManeuveringDriveActive,
  windAt,
  type Vec2,
  type WorldState,
} from './simulation';
import { campaignForMission, missionFromUrl, worldStateForMission } from './missions';
import { project, WORLD_MAP_HEIGHT, WORLD_MAP_WIDTH } from './world/coordinates';
import { drawLand } from './world/geography';
import {
  EXPLORATION_CELL,
  EXPLORATION_RADIUS,
  isWorldPointExplored,
  revealAroundWorldPoint,
  restoreExploration,
  exploredCells,
} from './exploration';
import { getExpeditionProgress, recordVoyage, saveExploredCells } from './expedition-progress';
import { shipPresetFromId } from './ship-selection';
import { actionForKeyboardEvent } from './keyboard-controls';
import { setStraitNavigationActive } from './world/environment';
import { visibilityAt, visibilityClouds } from './world/weather';
import { vesselInteractionDue, worldVesselsAt } from './world/vessels';
import { installStraitNavigationUi } from './strait-navigation-ui';
import { loadoutFromParams, suppliesFromLoadout } from './provisioning';
import { applyEncounterChoice, encounterDue, historicalDecisionDue, type VoyageEncounter } from './voyage-encounters';

const activeMission = missionFromUrl();
const isStraitMission = Boolean(activeMission.isStraitPassage);
setStraitNavigationActive(isStraitMission);
const activeCampaign = campaignForMission(activeMission);
const initialStep = activeMission.tutorialSteps?.[0];

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <main class="game-shell">
    <canvas id="ocean" width="${WORLD_MAP_WIDTH}" height="${WORLD_MAP_HEIGHT}" aria-label="Real-world ocean navigation map"></canvas>

    <header class="hud-top">
      <button id="mission-chip" class="mission-chip" aria-label="Open mission instructions">
        <span class="eyebrow">${activeCampaign.title}</span>
        <strong id="mission-title">${initialStep?.title ?? `Mission ${activeMission.number}. ${activeMission.title}`}</strong>
      </button>
      <div class="top-actions">
        <button id="reset" class="icon-button" aria-label="Restart mission">↻</button>
        <button id="help" class="icon-button" aria-label="Open help">?</button>
      </div>
    </header>

    <section class="expedition-status-bar" aria-label="Expedition resources and crew">
      <div class="expedition-status-heading"><span>Expedition</span><small id="expedition-endurance">0 days</small></div>
      <div class="expedition-status-item is-live"><span>Water</span><strong id="water-supply">0.0 t</strong></div>
      <div class="expedition-status-item is-live"><span>Provisions</span><strong id="provisions-supply">0.0 t</strong></div>
      <div class="expedition-status-item"><span>Repairs</span><strong id="repairs-supply">0.0 t</strong></div>
      <div class="expedition-status-item"><span>Trade & gifts</span><strong id="trade-supply">0.0 t</strong></div>
      <div class="expedition-status-item is-live"><span>Gold</span><strong id="treasury">0 m</strong></div>
      <div class="expedition-status-item"><span>Arms</span><strong id="arms-supply">0.0 t</strong></div>
      <div class="expedition-status-item"><span>Sailors</span><strong id="sailors-count">0</strong></div>
      <div class="expedition-status-item"><span>Soldiers</span><strong id="soldiers-count">0</strong></div>
    </section>

    <section class="instrument-strip" aria-label="Navigation instruments">
      <div class="instrument compass-instrument"><span class="instrument-label">Heading</span><div class="compass"><span id="compass-needle" class="compass-needle">↑</span></div><strong id="heading">0°</strong></div>
      <div class="instrument"><span class="instrument-label">Speed</span><strong id="speed">0.0 kn</strong><div class="meter"><span id="speed-bar" class="meter-fill"></span></div></div>
      <div class="instrument"><span class="instrument-label">Wind</span><strong id="wind">0.0</strong><div class="meter"><span id="wind-bar" class="meter-fill wind-fill"></span></div><small id="wind-bearing">0°</small></div>
      <div class="instrument"><span class="instrument-label">Current</span><strong id="current">0.0</strong><div class="meter"><span id="current-bar" class="meter-fill current-fill"></span></div><small id="current-bearing">0°</small></div>
      <div class="instrument progress-instrument"><span class="instrument-label">Voyage</span><strong id="distance">0 nm</strong><div class="meter"><span id="progress-bar" class="meter-fill progress-fill"></span></div><small id="elapsed">0.0 d</small></div>
    </section>

    <div class="control-dock">
      <section class="navigation-mode-control" aria-label="Navigation mode">
        <button id="navigation-mode-toggle" class="navigation-mode-button" type="button">Ocean mode</button>
        <button id="maneuver-drive-toggle" class="navigation-mode-button" type="button" hidden>Rowing: On</button>
      </section>
    <section class="bottom-controls" aria-label="Ship controls">
      <div class="control-block helm-control">
        <div class="control-heading"><span>Helm</span><strong id="rudder-readout">Centered</strong></div>
        <div class="dynamic-value-row"><span>Slip angle</span><strong id="slip-readout">0°</strong></div>
        <div class="helm-row">
          <div id="wheel" class="wheel" aria-hidden="true">✥</div>
          <div id="rudder-track" class="slider-stack slip-stack"><div class="dynamic-track slip-track" aria-hidden="true"><span class="track-center"></span><span id="slip-indicator" class="slip-indicator"></span></div><input id="rudder" type="range" min="-20" max="20" step="1" value="0" aria-label="Rudder angle"></div>
          <button id="center-rudder" class="center-button">Center</button>
        </div>
        <div class="range-labels"><span>Port</span><span>Starboard</span></div>
      </div>

      <div class="control-block sail-control">
        <div class="control-heading"><span>Sails</span><strong id="sail-readout">100%</strong></div>
        <div class="dynamic-value-row"><span>Apparent wind</span><strong id="apparent-wind-readout">0.0 kn</strong></div>
        <div class="sail-row"><span class="sail-icon" aria-hidden="true">◢</span><div class="slider-stack wind-stack"><div class="dynamic-track apparent-wind-track" aria-hidden="true"><span id="apparent-wind-fill" class="apparent-wind-fill"></span></div><input id="sails" type="range" min="0" max="100" step="1" value="100" aria-label="Sail area"></div></div>
        <div class="range-labels"><span>Furled</span><span>Full sail</span></div>
      </div>

      <div class="ship-vector-panel" aria-label="Ship-relative wind and current diagram">
        <div class="vector-panel-heading"><span>Ship forces</span><small>ship-relative</small></div>
        <svg id="ship-diagram" viewBox="0 0 150 120" role="img" aria-label="Ship-relative wind and current vectors">
          <defs>
            <marker id="arrow-wind" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#f4efe6" /></marker>
            <marker id="arrow-current" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#4bd4ff" /></marker>
            <marker id="arrow-track" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#e8b94f" /></marker>
          </defs>
          <circle cx="75" cy="60" r="42" class="vector-ring" /><line x1="75" y1="12" x2="75" y2="108" class="vector-axis" /><line x1="27" y1="60" x2="123" y2="60" class="vector-axis" /><text x="75" y="10" text-anchor="middle" class="bow-label">BOW</text>
          <g class="ship-silhouette"><path d="M75 24 C80 31 84 42 85 55 C86 69 84 82 80 92 L75 98 L70 92 C66 82 64 69 65 55 C66 42 70 31 75 24 Z" fill="rgba(235,208,152,.12)" stroke="#ead098" stroke-width="1.6" /></g>
          <line id="relative-wind-vector" x1="75" y1="60" x2="75" y2="32" class="diagram-vector wind-vector" marker-end="url(#arrow-wind)" />
          <line id="relative-current-vector" x1="75" y1="60" x2="96" y2="60" class="diagram-vector current-vector" marker-end="url(#arrow-current)" />
          <line id="track-vector" x1="75" y1="60" x2="75" y2="36" class="diagram-vector track-vector" marker-end="url(#arrow-track)" />
        </svg>
        <div class="vector-legend"><span class="wind-key">Wind</span><span class="current-key">Current</span><span class="track-key">Track</span></div>
      </div>

      <div class="time-control"><button data-time="0" class="time-button active">Pause</button><button data-time="1" class="time-button">1×</button><button data-time="4" class="time-button">4×</button><button data-time="16" class="time-button">16×</button></div>
    </section>
    </div>

    <div id="modal" class="modal open" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal-backdrop"></div>
      <section class="modal-card"><button id="close-modal" class="modal-close" aria-label="Close instructions">×</button><p id="mission-meta" class="eyebrow">${activeMission.from} → ${activeMission.to} · ${activeMission.date}</p><h1 id="modal-title">${activeMission.title}</h1><p id="modal-text"></p><div class="legend-row"><span><i class="legend-line wind-line"></i> Wind</span><span><i class="legend-line current-line"></i> Current</span><span><i class="legend-dot"></i> ${activeMission.to}</span></div><p id="mission-note" class="modal-note">${activeMission.historicalNote}</p><button id="start-mission" class="primary-button">Take the helm</button></section>
    </div>
    <div id="encounter-modal" class="modal encounter-modal" role="dialog" aria-modal="true" aria-labelledby="encounter-title">
      <div class="modal-backdrop"></div>
      <section class="modal-card"><p id="encounter-kind" class="eyebrow">Voyage encounter</p><h1 id="encounter-title"></h1><p id="encounter-text"></p><div id="encounter-choices" class="encounter-choices"></div><p id="encounter-result" class="modal-note" hidden></p><button id="encounter-continue" class="primary-button" hidden>Continue voyage</button></section>
    </div>
    <div id="toast" class="toast" role="status"></div>
  </main>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#ocean')!;
const ctx = canvas.getContext('2d')!;
const rudder = document.querySelector<HTMLInputElement>('#rudder')!;
const sails = document.querySelector<HTMLInputElement>('#sails')!;
const wheel = document.querySelector<HTMLElement>('#wheel')!;
const modal = document.querySelector<HTMLElement>('#modal')!;
const modalTitle = document.querySelector<HTMLElement>('#modal-title')!;
const modalText = document.querySelector<HTMLElement>('#modal-text')!;
const encounterModal = document.querySelector<HTMLElement>('#encounter-modal')!;
const encounterTitle = document.querySelector<HTMLElement>('#encounter-title')!;
const encounterText = document.querySelector<HTMLElement>('#encounter-text')!;
const encounterKind = document.querySelector<HTMLElement>('#encounter-kind')!;
const encounterChoices = document.querySelector<HTMLElement>('#encounter-choices')!;
const encounterResult = document.querySelector<HTMLElement>('#encounter-result')!;
const encounterContinue = document.querySelector<HTMLButtonElement>('#encounter-continue')!;
const missionTitle = document.querySelector<HTMLElement>('#mission-title')!;
const toast = document.querySelector<HTMLElement>('#toast')!;
const timeButtons = [...document.querySelectorAll<HTMLButtonElement>('.time-button')];

const selectedShipId = new URLSearchParams(window.location.search).get('ship') ?? 'nao';
const selectedLoadout = loadoutFromParams(new URLSearchParams(window.location.search), selectedShipId);
const START: WorldState = { ...worldStateForMission(activeMission), expedition: suppliesFromLoadout(selectedLoadout) };
const START_DISTANCE = distanceToDestination(START);
let state: WorldState = structuredClone(START);
let last = performance.now();
let reached = false;
let tutorialStage = 0;
let timeScale = 0;
let navigationMode: 'ocean' | 'maneuvering' = 'ocean';
let maneuveringDriveEnabled = true;
let distanceSailedNm = 0;
let route: { lat: number; lon: number }[] = [{ ...state.ship.position }];
const firedEncounters = new Set<string>();
let encounterOpen = false;
const tutorial = activeMission.tutorialSteps ?? [{ title: `Mission ${activeMission.number}. ${activeMission.title}`, text: activeMission.briefing }];
installStraitNavigationUi(() => state, isStraitMission);

function setTimeScale(value: number) {
  timeScale = value;
  document.querySelectorAll<HTMLButtonElement>('.time-button').forEach((button) => button.classList.toggle('active', Number(button.dataset.time) === value));
}
function setNavigationMode(mode: 'ocean' | 'maneuvering') {
  navigationMode = mode;
  setManeuveringDriveActive(mode === 'maneuvering' && maneuveringDriveEnabled);
  const values = mode === 'ocean' ? [0, 1, 4, 8, 16] : [0, .1, .25, .5, 1];
  document.querySelectorAll<HTMLButtonElement>('.time-button').forEach((button, index) => { const value = values[index]; button.hidden = value === undefined; if (value !== undefined) { button.dataset.time = String(value); button.textContent = index ? `${value}×` : 'Pause'; } });
  document.querySelector<HTMLButtonElement>('#navigation-mode-toggle')!.textContent = mode === 'ocean' ? 'Ocean mode' : 'Manoeuvring mode';
  document.querySelector<HTMLButtonElement>('#maneuver-drive-toggle')!.hidden = mode !== 'maneuvering';
  setTimeScale(0);
}

timeButtons.forEach((button) => button.addEventListener('click', () => setTimeScale(Number(button.dataset.time))));
document.querySelector<HTMLButtonElement>('#navigation-mode-toggle')!.addEventListener('click', () => setNavigationMode(navigationMode === 'ocean' ? 'maneuvering' : 'ocean'));
document.querySelector<HTMLButtonElement>('#maneuver-drive-toggle')!.addEventListener('click', () => { maneuveringDriveEnabled = !maneuveringDriveEnabled; const button = document.querySelector<HTMLButtonElement>('#maneuver-drive-toggle')!; button.textContent = `Rowing: ${maneuveringDriveEnabled ? 'On' : 'Off'}`; setManeuveringDriveActive(navigationMode === 'maneuvering' && maneuveringDriveEnabled); });
rudder.addEventListener('input', updateControlReadouts);
sails.addEventListener('input', updateControlReadouts);
document.querySelector('#center-rudder')!.addEventListener('click', () => { rudder.value = '0'; updateControlReadouts(); });
document.querySelector('#reset')!.addEventListener('click', resetMission);
document.querySelector('#help')!.addEventListener('click', openHelp);
document.querySelector('#mission-chip')!.addEventListener('click', openHelp);
document.querySelector('#close-modal')!.addEventListener('click', closeHelp);
document.querySelector('#start-mission')!.addEventListener('click', closeHelp);
modal.querySelector('.modal-backdrop')!.addEventListener('click', closeHelp);
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') { closeHelp(); return; }
  if (event.target instanceof Element && event.target.closest('input, textarea, select, button, [contenteditable="true"]')) return;
  if (document.querySelector('.keyboard-binding.is-capturing')) return;
  if (document.querySelector('.modal.open, .game-menu-overlay.open, .campaign-menu-overlay.open')) return;
  const action = actionForKeyboardEvent(event);
  if (!action) return;
  event.preventDefault();
  if (action === 'helmPort') rudder.value = String(Math.max(-20, Number(rudder.value) - 2));
  if (action === 'helmStarboard') rudder.value = String(Math.min(20, Number(rudder.value) + 2));
  if (action === 'sailsRaise') sails.value = String(Math.min(100, Number(sails.value) + 5));
  if (action === 'sailsLower') sails.value = String(Math.max(0, Number(sails.value) - 5));
  if (action === 'centerHelm') rudder.value = '0';
  if (action === 'anchor') document.querySelector<HTMLButtonElement>('#coastal-controls [data-anchor]:not([hidden])')?.click();
  if (action === 'camera') document.querySelector<HTMLButtonElement>('.camera-mode-button')?.click();
  if (action === 'navigation') document.querySelector<HTMLButtonElement>('.route-button')?.click();
  if (action === 'zoomIn') window.dispatchEvent(new CustomEvent('elcano:camera-zoom', { detail: 1.25 }));
  if (action === 'zoomOut') window.dispatchEvent(new CustomEvent('elcano:camera-zoom', { detail: .8 }));
  if (action === 'pauseResume') setTimeScale(timeScale === 0 ? 1 : 0);
  if (action === 'speed1') setTimeScale(1);
  if (action === 'speed4') setTimeScale(4);
  if (action === 'speed8') setTimeScale(8);
  if (action === 'speed16') setTimeScale(16);
  if (action === 'restart') resetMission();
  if (action === 'instructions') openHelp();
  if (action === 'missionMenu') window.dispatchEvent(new CustomEvent('elcano:open-game-menu'));
  updateControlReadouts();
});

function formatElapsedDays(hours: number) {
  return `${(hours / 24).toFixed(1)} ${Math.abs(hours - 24) < 0.05 ? 'day' : 'days'}`;
}

function formatSignedHeading(degrees: number) {
  const normalized = ((degrees % 360) + 360) % 360;
  const signed = normalized > 180 ? normalized - 360 : normalized;
  const rounded = Math.round(signed);
  if (rounded === 0) return '0°';
  return `${rounded > 0 ? '+' : ''}${rounded}°`;
}

function openHelp() {
  const step = tutorial[Math.min(tutorialStage, tutorial.length - 1)];
  modalTitle.textContent = reached ? `${activeMission.to} reached` : step.title;
  modalText.textContent = reached ? `${activeMission.completion} Voyage time: ${formatElapsedDays(state.elapsedHours)}.` : step.text;
  modal.classList.add('open');
}
function closeHelp() { modal.classList.remove('open'); }
function resetMission() {
  state = structuredClone(START); reached = false; tutorialStage = 0; distanceSailedNm = 0; route = [{ ...state.ship.position }]; firedEncounters.clear(); encounterOpen = false; encounterModal.classList.remove('open'); rudder.value = '0'; sails.value = '100'; setTimeScale(0); revealAroundShip(); window.dispatchEvent(new CustomEvent('elcano:mission-reset')); updateControlReadouts(); missionTitle.textContent = tutorial[0].title; showToast('Mission restarted · chart retained');
}

function openEncounter(key: string, encounter: VoyageEncounter) {
  firedEncounters.add(key); encounterOpen = true; setTimeScale(0);
  encounterKind.textContent = encounter.kind === 'history' ? 'Historical decision' : encounter.kind === 'contact' ? 'Contact sighting' : 'Seamanship encounter';
  encounterTitle.textContent = encounter.title; encounterText.textContent = encounter.text; encounterResult.hidden = true; encounterContinue.hidden = true;
  encounterChoices.innerHTML = '';
  encounter.choices.forEach((choice) => { const button = document.createElement('button'); button.className = 'encounter-choice'; button.textContent = choice.label; button.addEventListener('click', () => { state = { ...state, expedition: applyEncounterChoice(state.expedition, choice) }; encounterChoices.querySelectorAll('button').forEach((item) => item.disabled = true); encounterResult.textContent = choice.result; encounterResult.hidden = false; encounterContinue.hidden = false; updateControlReadouts(); }); encounterChoices.append(button); });
  encounterModal.classList.add('open');
}
encounterContinue.addEventListener('click', () => { encounterOpen = false; encounterModal.classList.remove('open'); });
function updateControlReadouts() {
  const r = Number(rudder.value); const side = r < 0 ? 'Port' : r > 0 ? 'Starboard' : 'Centered';
  setText('rudder-readout', r === 0 ? side : `${Math.abs(r)}° ${side}`); setText('sail-readout', `${sails.value}%`); wheel.style.transform = `rotate(${r * 3.5}deg)`;
  const rowing = document.querySelector<HTMLButtonElement>('#maneuver-drive-toggle');
  if (rowing && navigationMode === 'maneuvering') rowing.textContent = maneuveringDriveEnabled
    ? Number(sails.value) <= 25 ? 'Rowing: On' : 'Rowing: furl sails'
    : 'Rowing: Off';
}

function revealAroundShip() {
  revealAroundWorldPoint(project(state.ship.position));
}
function observationRadius() { return Math.max(10, EXPLORATION_RADIUS * Math.pow(visibilityAt(state.ship.position, state.time), 2)); }

function arrow(x: number, y: number, vector: Vec2, length: number) {
  const mag = Math.hypot(vector.x, vector.y) || 1; const ex = x + vector.x / mag * length; const ey = y - vector.y / mag * length;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
  const a = Math.atan2(ey - y, ex - x); ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - 6 * Math.cos(a - .5), ey - 6 * Math.sin(a - .5)); ctx.moveTo(ex, ey); ctx.lineTo(ex - 6 * Math.cos(a + .5), ey - 6 * Math.sin(a + .5)); ctx.stroke();
}

function drawGrid() {
  ctx.strokeStyle = 'rgba(255,255,255,.075)'; ctx.lineWidth = 1;
  for (let lon = -180; lon <= 180; lon += 20) { const a = project({ lat: -80, lon }); const b = project({ lat: 80, lon }); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
  for (let lat = -80; lat <= 80; lat += 10) { const a = project({ lat, lon: -180 }); const b = project({ lat, lon: 180 }); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
}

function drawEnvironment() {
  const ship = project(state.ship.position); const liveRadius = observationRadius();
  for (let lat = -60; lat <= 60; lat += 10) for (let lon = -170; lon <= 170; lon += 15) {
    const p = project({ lat, lon }); if (!isWorldPointExplored(p) || Math.hypot(p.x - ship.x, p.y - ship.y) > liveRadius) continue;
    const wind = windAt({ lat, lon }, state.time); const current = currentAt({ lat, lon }, state.time);
    ctx.strokeStyle = 'rgba(255,255,255,.34)'; arrow(p.x, p.y, wind, 14); ctx.strokeStyle = 'rgba(74,213,255,.75)'; arrow(p.x + 5, p.y + 5, current, 10);
  }
}

function drawFog() {
  ctx.fillStyle = 'rgba(3,12,18,.53)';
  for (let x = 0; x < canvas.width; x += EXPLORATION_CELL) for (let y = 0; y < canvas.height; y += EXPLORATION_CELL) if (!isWorldPointExplored({ x, y })) ctx.fillRect(x, y, EXPLORATION_CELL + 1, EXPLORATION_CELL + 1);
}

function drawVisibilityClouds() {
  const clouds = visibilityClouds(state.time);
  for (const cloud of clouds) {
    const point = project(cloud.center);
    if (!isWorldPointExplored(point)) continue;
    ctx.font = cloud.kind === 'fog' ? '18px system-ui' : '20px system-ui';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.globalAlpha = .82;
    if (cloud.kind === 'fog') [[0,0],[13,-5],[-13,5],[5,9],[-6,-10]].forEach(([x,y]) => ctx.fillText('☁️', point.x + x, point.y + y));
    else ctx.fillText('☁️', point.x, point.y);
    ctx.globalAlpha = 1;
  }
  const visibility = visibilityAt(state.ship.position, state.time);
  if (visibility >= .94) return;
  const ship = project(state.ship.position);
  const radius = 26 + visibility * 82;
  const veil = ctx.createRadialGradient(ship.x, ship.y, radius * .35, ship.x, ship.y, radius * 2.1);
  veil.addColorStop(0, `rgba(210,224,228,${(.38 * (1 - visibility)).toFixed(2)})`);
  veil.addColorStop(1, 'rgba(210,224,228,0)');
  ctx.fillStyle = veil; ctx.fillRect(ship.x - radius * 2.2, ship.y - radius * 2.2, radius * 4.4, radius * 4.4);
}

function drawWorldVessels() {
  const ship = project(state.ship.position); const liveRadius = observationRadius();
  for (const vessel of worldVesselsAt(state.time)) {
    const point = project(vessel.position); if (!isWorldPointExplored(point) || Math.hypot(point.x - ship.x, point.y - ship.y) > liveRadius) continue;
    ctx.save(); ctx.translate(point.x, point.y); ctx.rotate(vessel.headingDeg * Math.PI / 180); ctx.font = '18px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(vessel.kind === 'canoe' ? '🛶' : '⛵', 0, 0); ctx.restore();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height); gradient.addColorStop(0, '#1b5367'); gradient.addColorStop(.55, '#123d52'); gradient.addColorStop(1, '#092b3d'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid(); drawLand(ctx); drawEnvironment(); drawFog(); drawVisibilityClouds(); drawWorldVessels();

  const target = project(state.destination);
  const ship = project(state.ship.position);
  window.dispatchEvent(new CustomEvent('elcano:camera-target', { detail: target }));
  window.dispatchEvent(new CustomEvent('elcano:map-markers', {
    detail: { target, ship, headingDeg: state.ship.headingDeg, straitAnchorages: isStraitMission ? [{ name: 'Bahía Posesión', position: { lat: -52.42, lon: -69.05 } }, { name: 'Puerto del Hambre', position: { lat: -53.62, lon: -70.92 } }, { name: 'Bahía Fortescue', position: { lat: -53.70, lon: -72.35 } }] : [] },
  }));
  updateInstruments();
  window.dispatchEvent(new CustomEvent('elcano:simulation-time', { detail: state.time.toISOString() }));
  window.dispatchEvent(new CustomEvent('elcano:observation-change', { detail: { position: state.ship.position, radius: observationRadius() } }));

  if (!reached && distanceToDestination(state) < 20) {
    reached = true;
    setTimeScale(0);
    recordVoyage(activeMission.id, { completedAt: new Date().toISOString(), elapsedHours: state.elapsedHours, distanceNm: distanceSailedNm, shipId: shipPresetFromId(new URLSearchParams(window.location.search).get('ship')).id, route });
    missionTitle.textContent = 'Mission complete';
    showToast(`${activeMission.to} · logbook updated`);
    openHelp();
  }
}

function updateInstruments() {
  const wind = windAt(state.ship.position, state.time); const current = currentAt(state.ship.position, state.time); const sail = sailingVelocity(state.ship.headingDeg, wind, Number(sails.value) / 100);
  const drive = maneuveringDriveVelocity(state.ship.headingDeg, wind, Number(sails.value) / 100);
  const ground = { x: sail.x + drive.x + current.x, y: sail.y + drive.y + current.y }; const apparent = { x: wind.x - ground.x, y: wind.y - ground.y };
  const speed = Math.hypot(ground.x, ground.y); const windSpeed = Math.hypot(wind.x, wind.y); const currentSpeed = Math.hypot(current.x, current.y); const distance = distanceToDestination(state); const progress = Math.max(0, Math.min(1, 1 - distance / START_DISTANCE));
  setText('heading', formatSignedHeading(state.ship.headingDeg)); setText('speed', `${speed.toFixed(2)} kn`); setText('wind', windSpeed.toFixed(1)); setText('wind-bearing', bearing(wind)); setText('current', currentSpeed.toFixed(2)); setText('current-bearing', bearing(current)); setText('distance', `${distance.toFixed(0)} nm`); setText('elapsed', `${(state.elapsedHours / 24).toFixed(1)} d`);
  if (state.expedition) {
    const supplies = state.expedition;
    const people = supplies.sailors + supplies.soldiers;
    const waterDays = people ? supplies.water / (people * .003) : 0;
    const provisionDays = people ? supplies.provisions / (people * .0015) : 0;
    setText('water-supply', `${supplies.water.toFixed(1)} t`);
    setText('provisions-supply', `${supplies.provisions.toFixed(1)} t`);
    setText('repairs-supply', `${supplies.repairStores.toFixed(1)} t`);
    setText('trade-supply', `${supplies.tradeGoods.toFixed(1)} t`);
    setText('treasury', `${Math.floor(supplies.goldMaravedis).toLocaleString()} m`);
    setText('arms-supply', `${supplies.arms.toFixed(1)} t`);
    setText('sailors-count', String(supplies.sailors));
    setText('soldiers-count', String(supplies.soldiers));
    setText('expedition-endurance', `${Math.floor(Math.min(waterDays, provisionDays))} days`);
  }
  setWidth('speed-bar', speed / 10 * 100); setWidth('wind-bar', windSpeed / 25 * 100); setWidth('current-bar', currentSpeed / 1.5 * 100); setWidth('progress-bar', progress * 100); document.querySelector<HTMLElement>('#compass-needle')!.style.transform = `rotate(${state.ship.headingDeg}deg)`;
  const course = vectorBearing(ground); const slip = signedAngleDifference(course, state.ship.headingDeg); setText('slip-readout', `${Math.abs(slip).toFixed(1)}°${Math.abs(slip) < .5 ? '' : slip < 0 ? ' port' : ' starboard'}`); const indicator = document.querySelector<HTMLElement>('#slip-indicator')!; indicator.style.left = `${50 + Math.max(-45, Math.min(45, slip)) / 90 * 100}%`;
  setText('apparent-wind-readout', `${Math.hypot(apparent.x, apparent.y).toFixed(2)} kn`); setWidth('apparent-wind-fill', Math.hypot(apparent.x, apparent.y) / 25 * 100); updateShipDiagram(apparent, current, ground);
}

function updateShipDiagram(wind: Vec2, current: Vec2, track: Vec2) { setDiagramVector('relative-wind-vector', intoShipFrame(wind), 37); setDiagramVector('relative-current-vector', intoShipFrame(current), 33); setDiagramVector('track-vector', intoShipFrame(track), 31); }
function intoShipFrame(v: Vec2): Vec2 { const h = state.ship.headingDeg * Math.PI / 180; return { x: v.x * Math.sin(h) + v.y * Math.cos(h), y: v.x * Math.cos(h) - v.y * Math.sin(h) }; }
function setDiagramVector(id: string, local: Vec2, max: number) { const e = document.querySelector<SVGLineElement>(`#${id}`)!; const m = Math.hypot(local.x, local.y); if (m < .001) { e.setAttribute('x2','75'); e.setAttribute('y2','60'); return; } const s = Math.min(max, 15 + m * 2) / m; e.setAttribute('x2', String(75 + local.y * s)); e.setAttribute('y2', String(60 - local.x * s)); }
function vectorBearing(v: Vec2) { return (Math.atan2(v.x, v.y) * 180 / Math.PI + 360) % 360; }
function bearing(v: Vec2) { return `${vectorBearing(v).toFixed(0)}°`; }
function signedAngleDifference(target: number, reference: number) { return ((target - reference + 540) % 360) - 180; }
function setText(id: string, value: string) { document.querySelector<HTMLElement>(`#${id}`)!.textContent = value; }
function setWidth(id: string, percent: number) { document.querySelector<HTMLElement>(`#${id}`)!.style.width = `${Math.max(0, Math.min(100, percent))}%`; }
let toastTimer = 0; function showToast(message: string) { toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = window.setTimeout(() => toast.classList.remove('show'), 1700); }

function updateTutorial() {
  if (reached) return;
  if (!activeMission.tutorialSteps) {
    missionTitle.textContent = `Mission ${activeMission.number}. ${activeMission.title}`;
    return;
  }
  if (tutorialStage === 0 && timeScale > 0 && Number(sails.value) > 20) tutorialStage = 1;
  if (tutorialStage === 1 && state.ship.position.lon < -5.5) tutorialStage = 2;
  missionTitle.textContent = tutorial[Math.min(tutorialStage, tutorial.length - 1)].title;
}

function frame(now: number) {
  const seconds = Math.min((now - last) / 1000, .1); last = now;
  if (timeScale > 0 && !reached && !encounterOpen) { const dtHours = seconds * timeScale; const r = Number(rudder.value); const speedFactor = Math.max(.25, Math.min(1, state.ship.speed / 6)); const helmRate = navigationMode === 'maneuvering' ? 1.55 : .9; state.ship.headingDeg = (state.ship.headingDeg + r * helmRate * speedFactor * dtHours + 360) % 360; state = stepWorld(state, dtHours, Number(sails.value) / 100); distanceSailedNm += state.ship.speed * dtHours; const lastRoute = route[route.length - 1]; if (route.length < 48 && Math.hypot(lastRoute.lat - state.ship.position.lat, lastRoute.lon - state.ship.position.lon) > .8) route.push({ ...state.ship.position }); const progress = Math.max(0, Math.min(1, 1 - distanceToDestination(state) / START_DISTANCE)); const due = vesselInteractionDue(activeMission.id, state.ship.position, state.time, firedEncounters) ?? encounterDue(activeMission.id, state.ship.position, state.time, state.elapsedHours, firedEncounters) ?? historicalDecisionDue(activeMission.id, progress, firedEncounters); if (due) openEncounter(due.key, due.encounter); }
  revealAroundShip(); updateTutorial(); updateControlReadouts(); draw(); requestAnimationFrame(frame);
}

restoreExploration(getExpeditionProgress().exploredCells);
window.addEventListener('elcano:exploration-change', () => saveExploredCells(exploredCells));
modalText.textContent = tutorial[0].text;
revealAroundShip();
updateControlReadouts();
requestAnimationFrame(frame);
