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
  <main class="shell">
    <header class="topbar">
      <div>
        <p class="eyebrow">Age of Sail navigation prototype</p>
        <h1>Elcano</h1>
      </div>
      <div class="controls">
        <button id="turn-left">◀ Turn</button>
        <button id="turn-right">Turn ▶</button>
        <button id="reset">Restart mission</button>
        <label>Time
          <select id="time-scale">
            <option value="0" selected>Paused</option>
            <option value="0.25">1×</option>
            <option value="1">4×</option>
            <option value="4">16×</option>
            <option value="16">64×</option>
          </select>
        </label>
      </div>
    </header>

    <section class="mission-card">
      <div>
        <p class="eyebrow">Tutorial mission · Atlantic proving ground</p>
        <h2 id="tutorial-title">1. Read the sea</h2>
      </div>
      <p id="tutorial-text">Your ship is paused. White arrows show wind; blue arrows show current. Turn to roughly 330° so the ship heads northeast toward the favorable east-going current band.</p>
    </section>

    <section class="game-layout">
      <canvas id="ocean" width="1000" height="650"></canvas>
      <aside class="panel">
        <h2>Navigation</h2>
        <dl>
          <div><dt>Heading</dt><dd id="heading"></dd></div>
          <div><dt>Speed</dt><dd id="speed"></dd></div>
          <div><dt>Wind</dt><dd id="wind"></dd></div>
          <div><dt>Current</dt><dd id="current"></dd></div>
          <div><dt>Elapsed</dt><dd id="elapsed"></dd></div>
          <div><dt>Distance</dt><dd id="distance"></dd></div>
        </dl>
        <p class="legend"><span class="wind-key"></span> Wind <span class="current-key"></span> Current</p>
        <p class="hint">Turn with the buttons or ← / →. Ocean conditions are revealed around your explored route.</p>
        <p id="status" class="status">Mission objective: reach the golden destination.</p>
      </aside>
    </section>
  </main>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#ocean')!;
const ctx = canvas.getContext('2d')!;
const turnLeft = document.querySelector<HTMLButtonElement>('#turn-left')!;
const turnRight = document.querySelector<HTMLButtonElement>('#turn-right')!;
const reset = document.querySelector<HTMLButtonElement>('#reset')!;
const timeScale = document.querySelector<HTMLSelectElement>('#time-scale')!;
const tutorialTitle = document.querySelector<HTMLElement>('#tutorial-title')!;
const tutorialText = document.querySelector<HTMLElement>('#tutorial-text')!;
const status = document.querySelector<HTMLElement>('#status')!;

const START: WorldState = {
  timeHours: 0,
  ship: { x: 120, y: 350, headingDeg: 0, speed: 0 },
  destination: { x: 650, y: 245 },
};

let state: WorldState = structuredClone(START);
const explored = new Set<string>();
let last = performance.now();
let reached = false;
let tutorialStage = 0;

function turn(delta: number) {
  state.ship.headingDeg = (state.ship.headingDeg + delta + 360) % 360;
  updateTutorial();
}

turnLeft.addEventListener('click', () => turn(-10));
turnRight.addEventListener('click', () => turn(10));
reset.addEventListener('click', resetMission);
timeScale.addEventListener('change', updateTutorial);
window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') turn(-10);
  if (event.key === 'ArrowRight') turn(10);
});

function resetMission() {
  state = structuredClone(START);
  explored.clear();
  reached = false;
  tutorialStage = 0;
  timeScale.value = '0';
  status.textContent = 'Mission objective: reach the golden destination.';
  revealAroundShip();
  updateTutorial();
}

function updateTutorial() {
  if (reached) {
    tutorialTitle.textContent = 'Mission complete';
    tutorialText.textContent = 'You made landfall. Restart the mission and experiment with a different route to see how the same ocean produces a different travel time.';
    return;
  }

  const heading = state.ship.headingDeg;
  const northeastCourse = heading >= 310 && heading <= 350;

  if (tutorialStage === 0 && northeastCourse) tutorialStage = 1;
  if (tutorialStage === 1 && Number(timeScale.value) > 0) tutorialStage = 2;
  if (tutorialStage === 2 && state.ship.y < 300) tutorialStage = 3;

  if (tutorialStage === 0) {
    tutorialTitle.textContent = '1. Read the sea';
    tutorialText.textContent = 'Your ship is paused. White arrows show wind; blue arrows show current. Turn to roughly 330° so the ship heads northeast toward the favorable east-going current band.';
  } else if (tutorialStage === 1) {
    tutorialTitle.textContent = '2. Make way';
    tutorialText.textContent = 'Good course. Set time to 16× or 64×. The ship will move according to its heading, sailing efficiency, wind, and current — not toward the marker automatically.';
  } else if (tutorialStage === 2) {
    tutorialTitle.textContent = '3. Find the current';
    tutorialText.textContent = 'Keep moving northeast until you are around the upper half of the map. Watch the blue current readout strengthen eastward. You are trading some distance now for a faster west-to-east passage later.';
  } else {
    tutorialTitle.textContent = '4. Turn for the destination';
    tutorialText.textContent = 'You have reached the useful current band. Turn gradually toward 0°–10° (east) and use the current to carry you toward the golden destination. Adjust as needed for the final approach.';
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
  gradient.addColorStop(0, '#173f52');
  gradient.addColorStop(1, '#0d2d3d');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(255,255,255,.06)';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 50) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 50) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }

  // Subtle tutorial cue for the favorable current band.
  ctx.fillStyle = 'rgba(91,210,255,.055)';
  ctx.fillRect(0, 220, canvas.width, 90);

  const cell = 25;
  for (const key of explored) {
    const [cx, cy] = key.split(',').map(Number);
    const x = cx * cell;
    const y = cy * cell;
    const wind = windAt(x, y, state.timeHours);
    const current = currentAt(x, y);

    ctx.strokeStyle = 'rgba(255,255,255,.30)';
    arrow(x, y, wind.x, wind.y, 18);
    ctx.strokeStyle = 'rgba(91,210,255,.65)';
    arrow(x + 7, y + 7, current.x, current.y, 12);
  }

  ctx.fillStyle = 'rgba(3, 12, 18, .64)';
  for (let x = 0; x < canvas.width; x += cell) {
    for (let y = 0; y < canvas.height; y += cell) {
      if (!explored.has(`${Math.round(x / cell)},${Math.round(y / cell)}`)) {
        ctx.fillRect(x, y, cell + 1, cell + 1);
      }
    }
  }

  ctx.fillStyle = '#e5b94f';
  ctx.beginPath();
  ctx.arc(state.destination.x, state.destination.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = '14px system-ui';
  ctx.fillText('Destination', state.destination.x + 18, state.destination.y + 5);

  ctx.save();
  ctx.translate(state.ship.x, state.ship.y);
  ctx.rotate(state.ship.headingDeg * Math.PI / 180);
  ctx.fillStyle = '#f3ead8';
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(-14, -9);
  ctx.lineTo(-8, 0);
  ctx.lineTo(-14, 9);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  const wind = windAt(state.ship.x, state.ship.y, state.timeHours);
  const current = currentAt(state.ship.x, state.ship.y);
  setText('heading', `${state.ship.headingDeg.toFixed(0)}°`);
  setText('speed', `${state.ship.speed.toFixed(2)} kn`);
  setText('wind', `${bearing(wind)} · ${Math.hypot(wind.x, wind.y).toFixed(2)}`);
  setText('current', `${bearing(current)} · ${Math.hypot(current.x, current.y).toFixed(2)}`);
  setText('elapsed', `${state.timeHours.toFixed(1)} h`);
  setText('distance', `${distanceToDestination(state).toFixed(0)} nm`);

  if (!reached && distanceToDestination(state) < 25) {
    reached = true;
    timeScale.value = '0';
    status.textContent = `Landfall after ${state.timeHours.toFixed(1)} hours. Tutorial complete.`;
    updateTutorial();
  }
}

function setText(id: string, value: string) {
  document.querySelector(`#${id}`)!.textContent = value;
}

function bearing(v: { x: number; y: number }) {
  const deg = (Math.atan2(v.y, v.x) * 180 / Math.PI + 360) % 360;
  return `${deg.toFixed(0)}°`;
}

function frame(now: number) {
  const seconds = Math.min((now - last) / 1000, 0.1);
  last = now;
  const scale = Number(timeScale.value);
  if (scale > 0 && !reached) {
    state = stepWorld(state, seconds * scale);
    state.ship.x = Math.max(10, Math.min(canvas.width - 10, state.ship.x));
    state.ship.y = Math.max(10, Math.min(canvas.height - 10, state.ship.y));
  }
  revealAroundShip();
  updateTutorial();
  draw();
  requestAnimationFrame(frame);
}

revealAroundShip();
updateTutorial();
requestAnimationFrame(frame);
