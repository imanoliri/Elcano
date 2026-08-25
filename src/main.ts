import './style.css';
import {
  currentAt,
  distanceToDestination,
  stepWorld,
  windAt,
  type WorldState,
} from './simulation';

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <main class="game-shell">
    <canvas id="ocean" width="1000" height="650" aria-label="Ocean navigation map"></canvas>

    <header class="hud-top">
      <button id="mission-chip" class="mission-chip" aria-label="Open mission instructions">
        <span class="eyebrow">Tutorial mission</span>
        <strong id="mission-title">1. Read the sea</strong>
      </button>
      <div class="top-actions">
        <button id="reset" class="icon-button" aria-label="Restart mission">↻</button>
        <button id="help" class="icon-button" aria-label="Open help">?</button>
      </div>
    </header>

    <section class="instrument-strip" aria-label="Navigation instruments">
      <div class="instrument compass-instrument">
        <span class="instrument-label">Heading</span>
        <div id="compass" class="compass"><span class="compass-needle">↑</span></div>
        <strong id="heading">0°</strong>
      </div>
      <div class="instrument">
        <span class="instrument-label">Speed</span>
        <strong id="speed">0.0 kn</strong>
        <div class="meter"><span id="speed-bar" class="meter-fill"></span></div>
      </div>
      <div class="instrument">
        <span class="instrument-label">Wind</span>
        <strong id="wind">0.0</strong>
        <div class="meter"><span id="wind-bar" class="meter-fill wind-fill"></span></div>
        <small id="wind-bearing">0°</small>
      </div>
      <div class="instrument">
        <span class="instrument-label">Current</span>
        <strong id="current">0.0</strong>
        <div class="meter"><span id="current-bar" class="meter-fill current-fill"></span></div>
        <small id="current-bearing">0°</small>
      </div>
      <div class="instrument progress-instrument">
        <span class="instrument-label">Voyage</span>
        <strong id="distance">0 nm</strong>
        <div class="meter"><span id="progress-bar" class="meter-fill progress-fill"></span></div>
        <small id="elapsed">0.0 h</small>
      </div>
    </section>

    <section class="bottom-controls" aria-label="Ship controls">
      <div class="control-block helm-control">
        <div class="control-heading">
          <span>Helm</span>
          <strong id="rudder-readout">Centered</strong>
        </div>
        <div class="helm-row">
          <div id="wheel" class="wheel" aria-hidden="true">✥</div>
          <input id="rudder" type="range" min="-45" max="45" step="1" value="0" aria-label="Rudder angle">
          <button id="center-rudder" class="center-button">Center</button>
        </div>
        <div class="range-labels"><span>Port</span><span>Starboard</span></div>
      </div>

      <div class="control-block sail-control">
        <div class="control-heading">
          <span>Sails</span>
          <strong id="sail-readout">75%</strong>
        </div>
        <div class="sail-row">
          <span class="sail-icon" aria-hidden="true">◢</span>
          <input id="sails" type="range" min="0" max="100" step="1" value="75" aria-label="Sail area">
        </div>
        <div class="range-labels"><span>Furled</span><span>Full sail</span></div>
      </div>

      <div class="time-control">
        <button data-time="0" class="time-button active">Pause</button>
        <button data-time="1" class="time-button">1×</button>
        <button data-time="4" class="time-button">4×</button>
        <button data-time="16" class="time-button">16×</button>
      </div>
    </section>

    <div id="modal" class="modal open" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal-backdrop"></div>
      <section class="modal-card">
        <button id="close-modal" class="modal-close" aria-label="Close instructions">×</button>
        <p class="eyebrow">Atlantic proving ground</p>
        <h1 id="modal-title">Learn to read the sea</h1>
        <p id="modal-text"></p>
        <div class="legend-row">
          <span><i class="legend-line wind-line"></i> Wind</span>
          <span><i class="legend-line current-line"></i> Current</span>
          <span><i class="legend-dot"></i> Destination</span>
        </div>
        <p class="modal-note">The ship does not move toward the destination automatically. Your heading, sail area, wind and current determine the actual track.</p>
        <button id="start-mission" class="primary-button">Take the helm</button>
      </section>
    </div>

    <div id="toast" class="toast" role="status"></div>
  </main>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#ocean')!;
const ctx = canvas.getContext('2d')!;
const rudder = document.querySelector<HTMLInputElement>('#rudder')!;
const sails = document.querySelector<HTMLInputElement>('#sails')!;
const wheel = document.querySelector<HTMLElement>('#wheel')!;
const centerRudder = document.querySelector<HTMLButtonElement>('#center-rudder')!;
const reset = document.querySelector<HTMLButtonElement>('#reset')!;
const help = document.querySelector<HTMLButtonElement>('#help')!;
const missionChip = document.querySelector<HTMLButtonElement>('#mission-chip')!;
const modal = document.querySelector<HTMLElement>('#modal')!;
const closeModal = document.querySelector<HTMLButtonElement>('#close-modal')!;
const startMission = document.querySelector<HTMLButtonElement>('#start-mission')!;
const modalTitle = document.querySelector<HTMLElement>('#modal-title')!;
const modalText = document.querySelector<HTMLElement>('#modal-text')!;
const missionTitle = document.querySelector<HTMLElement>('#mission-title')!;
const toast = document.querySelector<HTMLElement>('#toast')!;
const timeButtons = [...document.querySelectorAll<HTMLButtonElement>('.time-button')];

const START: WorldState = {
  timeHours: 0,
  ship: { x: 120, y: 350, headingDeg: 0, speed: 0 },
  destination: { x: 650, y: 245 },
};
const START_DISTANCE = distanceToDestination(START);

let state: WorldState = structuredClone(START);
const explored = new Set<string>();
let last = performance.now();
let reached = false;
let tutorialStage = 0;
let timeScale = 0;

const tutorial = [
  {
    title: '1. Read the sea',
    text: 'White arrows show wind; blue arrows show current. Use the helm to turn toward roughly 330° so you head northeast toward the favorable current band.',
  },
  {
    title: '2. Make way',
    text: 'Set some sail and start time. Your ship accelerates according to the wind angle and sail area. The current adds its own motion underneath you.',
  },
  {
    title: '3. Find the current',
    text: 'Keep working northeast into the upper half of the chart. Watch the blue current gauge: a stronger current can justify sailing a longer geometric route.',
  },
  {
    title: '4. Turn for landfall',
    text: 'Once you reach the favorable band, steer gradually east toward 0°–10° and use the current to carry you toward the golden destination.',
  },
];

function setTimeScale(value: number) {
  timeScale = value;
  timeButtons.forEach((button) => button.classList.toggle('active', Number(button.dataset.time) === value));
  updateTutorial();
}

timeButtons.forEach((button) => button.addEventListener('click', () => setTimeScale(Number(button.dataset.time))));

rudder.addEventListener('input', updateControlReadouts);
sails.addEventListener('input', updateControlReadouts);
centerRudder.addEventListener('click', () => {
  rudder.value = '0';
  updateControlReadouts();
});
reset.addEventListener('click', resetMission);
help.addEventListener('click', openHelp);
missionChip.addEventListener('click', openHelp);
closeModal.addEventListener('click', closeHelp);
startMission.addEventListener('click', closeHelp);
modal.querySelector('.modal-backdrop')!.addEventListener('click', closeHelp);
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeHelp();
  if (event.key === 'ArrowLeft') rudder.value = String(Math.max(-45, Number(rudder.value) - 5));
  if (event.key === 'ArrowRight') rudder.value = String(Math.min(45, Number(rudder.value) + 5));
  updateControlReadouts();
});

function openHelp() {
  const step = tutorial[Math.min(tutorialStage, tutorial.length - 1)];
  modalTitle.textContent = reached ? 'Mission complete' : step.title;
  modalText.textContent = reached
    ? `Landfall after ${state.timeHours.toFixed(1)} hours. Restart and try another route to compare how wind and current change the result.`
    : step.text;
  startMission.textContent = reached ? 'Close' : 'Take the helm';
  modal.classList.add('open');
}

function closeHelp() {
  modal.classList.remove('open');
}

function resetMission() {
  state = structuredClone(START);
  explored.clear();
  reached = false;
  tutorialStage = 0;
  rudder.value = '0';
  sails.value = '75';
  setTimeScale(0);
  revealAroundShip();
  updateControlReadouts();
  updateTutorial();
  showToast('Mission restarted');
}

function updateControlReadouts() {
  const rudderValue = Number(rudder.value);
  const sailValue = Number(sails.value);
  const side = rudderValue < 0 ? 'Port' : rudderValue > 0 ? 'Starboard' : 'Centered';
  setText('rudder-readout', rudderValue === 0 ? side : `${Math.abs(rudderValue)}° ${side}`);
  setText('sail-readout', `${sailValue}%`);
  wheel.style.transform = `rotate(${rudderValue * 2.4}deg)`;
}

function updateTutorial() {
  if (reached) {
    missionTitle.textContent = 'Mission complete';
    return;
  }

  const heading = state.ship.headingDeg;
  const northeastCourse = heading >= 310 && heading <= 350;
  if (tutorialStage === 0 && northeastCourse) tutorialStage = 1;
  if (tutorialStage === 1 && timeScale > 0 && Number(sails.value) > 20) tutorialStage = 2;
  if (tutorialStage === 2 && state.ship.y < 300) tutorialStage = 3;

  const step = tutorial[Math.min(tutorialStage, tutorial.length - 1)];
  missionTitle.textContent = step.title;
  if (modal.classList.contains('open')) {
    modalTitle.textContent = step.title;
    modalText.textContent = step.text;
  }
}

function revealAroundShip() {
  const radius = 90;
  const cell = 25;
  for (let x = state.ship.x - radius; x <= state.ship.x + radius; x += cell) {
    for (let y = state.ship.y - radius; y <= state.ship.y + radius; y += cell) {
      if (Math.hypot(x - state.ship.x, y - state.ship.y) <= radius) {
        explored.add(`${Math.round(x / cell)},${Math.round(y / cell)}`);
      }
    }
  }
}

function arrow(x: number, y: number, vx: number, vy: number, length: number) {
  const mag = Math.hypot(vx, vy) || 1;
  const ex = x + (vx / mag) * length;
  const ey = y + (vy / mag) * length;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  const a = Math.atan2(ey - y, ex - x);
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex - 7 * Math.cos(a - 0.5), ey - 7 * Math.sin(a - 0.5));
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex - 7 * Math.cos(a + 0.5), ey - 7 * Math.sin(a + 0.5));
  ctx.stroke();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#1b5367');
  gradient.addColorStop(0.55, '#123d52');
  gradient.addColorStop(1, '#092b3d');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(255,255,255,.055)';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 50) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 50) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }

  ctx.fillStyle = 'rgba(76,207,255,.05)';
  ctx.fillRect(0, 220, canvas.width, 90);

  const cell = 25;
  for (const key of explored) {
    const [cx, cy] = key.split(',').map(Number);
    const x = cx * cell;
    const y = cy * cell;
    const wind = windAt(x, y, state.timeHours);
    const current = currentAt(x, y);
    ctx.strokeStyle = 'rgba(255,255,255,.38)';
    arrow(x, y, wind.x, wind.y, 18);
    ctx.strokeStyle = 'rgba(74,213,255,.78)';
    arrow(x + 7, y + 7, current.x, current.y, 12);
  }

  ctx.fillStyle = 'rgba(3, 12, 18, .61)';
  for (let x = 0; x < canvas.width; x += cell) {
    for (let y = 0; y < canvas.height; y += cell) {
      if (!explored.has(`${Math.round(x / cell)},${Math.round(y / cell)}`)) ctx.fillRect(x, y, cell + 1, cell + 1);
    }
  }

  ctx.fillStyle = '#f0bd45';
  ctx.beginPath();
  ctx.arc(state.destination.x, state.destination.y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(240,189,69,.35)';
  ctx.lineWidth = 8;
  ctx.stroke();

  ctx.save();
  ctx.translate(state.ship.x, state.ship.y);
  ctx.rotate(state.ship.headingDeg * Math.PI / 180);
  ctx.fillStyle = '#f7f0df';
  ctx.beginPath();
  ctx.moveTo(20, 0);
  ctx.lineTo(-15, -10);
  ctx.lineTo(-8, 0);
  ctx.lineTo(-15, 10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  updateInstruments();

  if (!reached && distanceToDestination(state) < 25) {
    reached = true;
    setTimeScale(0);
    updateTutorial();
    showToast(`Landfall · ${state.timeHours.toFixed(1)} hours`);
    openHelp();
  }
}

function updateInstruments() {
  const wind = windAt(state.ship.x, state.ship.y, state.timeHours);
  const current = currentAt(state.ship.x, state.ship.y);
  const windStrength = Math.hypot(wind.x, wind.y);
  const currentStrength = Math.hypot(current.x, current.y);
  const distance = distanceToDestination(state);
  const progress = Math.max(0, Math.min(1, 1 - distance / START_DISTANCE));

  setText('heading', `${state.ship.headingDeg.toFixed(0)}°`);
  setText('speed', `${state.ship.speed.toFixed(2)} kn`);
  setText('wind', windStrength.toFixed(2));
  setText('current', currentStrength.toFixed(2));
  setText('wind-bearing', bearing(wind));
  setText('current-bearing', bearing(current));
  setText('elapsed', `${state.timeHours.toFixed(1)} h`);
  setText('distance', `${distance.toFixed(0)} nm`);

  setBar('speed-bar', state.ship.speed / 2.2);
  setBar('wind-bar', windStrength / 1.3);
  setBar('current-bar', currentStrength / 0.7);
  setBar('progress-bar', progress);
  document.querySelector<HTMLElement>('.compass-needle')!.style.transform = `rotate(${state.ship.headingDeg}deg)`;
}

function setBar(id: string, ratio: number) {
  document.querySelector<HTMLElement>(`#${id}`)!.style.width = `${Math.max(4, Math.min(100, ratio * 100))}%`;
}

function setText(id: string, value: string) {
  document.querySelector(`#${id}`)!.textContent = value;
}

function bearing(v: { x: number; y: number }) {
  const deg = (Math.atan2(v.y, v.x) * 180 / Math.PI + 360) % 360;
  return `${deg.toFixed(0)}°`;
}

function showToast(message: string) {
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 2200);
}

function frame(now: number) {
  const seconds = Math.min((now - last) / 1000, 0.1);
  last = now;
  if (timeScale > 0 && !reached) {
    const dt = seconds * timeScale;
    const rudderAngle = Number(rudder.value);
    state.ship.headingDeg = (state.ship.headingDeg + rudderAngle * 0.03 * dt + 360) % 360;
    state = stepWorld(state, dt, Number(sails.value) / 100);
    state.ship.x = Math.max(10, Math.min(canvas.width - 10, state.ship.x));
    state.ship.y = Math.max(10, Math.min(canvas.height - 10, state.ship.y));
  }
  revealAroundShip();
  updateTutorial();
  draw();
  requestAnimationFrame(frame);
}

revealAroundShip();
updateControlReadouts();
updateTutorial();
openHelp();
requestAnimationFrame(frame);
