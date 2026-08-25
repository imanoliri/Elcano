import './telemetry-ui.css';

const rudder = document.querySelector<HTMLInputElement>('#rudder');
const sails = document.querySelector<HTMLInputElement>('#sails');
const slipIndicator = document.querySelector<HTMLElement>('#slip-indicator');
const slipReadout = document.querySelector<HTMLElement>('#slip-readout');
const slipStack = document.querySelector<HTMLElement>('.slip-stack');
const windStack = document.querySelector<HTMLElement>('.wind-stack');
const windReadout = document.querySelector<HTMLElement>('#apparent-wind-readout');
const windVector = document.querySelector<SVGLineElement>('#relative-wind-vector');
const shipSilhouette = document.querySelector<SVGGElement>('.ship-silhouette');
const shipDiagram = document.querySelector<SVGSVGElement>('#ship-diagram');

// Replace the tiny ship drawing with a cleaner carrack/nao silhouette. The bow
// stays narrow, while the body and especially the stern are fuller, closer to
// the proportions of an exploration-era nao.
if (shipSilhouette) {
  shipSilhouette.innerHTML = `
    <path d="M75 23
      C81 30 87 43 89 57
      C91 71 90 83 86 91
      C83 96 79 99 75 101
      C71 99 67 96 64 91
      C60 83 59 71 61 57
      C63 43 69 30 75 23 Z"
      fill="rgba(235,208,152,.12)" stroke="#ead098" stroke-width="1.6" />
    <path d="M65 87 Q75 94 85 87" fill="none" stroke="rgba(234,208,152,.78)" stroke-width="1.15" />
    <path d="M75 31 L75 89" fill="none" stroke="rgba(234,208,152,.78)" stroke-width="1.15" />
    <path d="M61 43 Q75 40.5 89 43 L88 49 Q75 47 62 49 Z"
      fill="rgba(244,239,230,.72)" stroke="rgba(244,239,230,.94)" stroke-width=".6" />
    <path d="M63 59 Q75 57 87 59 L86 64 Q75 62.5 64 64 Z"
      fill="rgba(244,239,230,.58)" stroke="rgba(244,239,230,.88)" stroke-width=".55" />
  `;
}

// Label the four ship-relative directions around the force diagram.
if (shipDiagram) {
  const ns = 'http://www.w3.org/2000/svg';
  const bowLabel = shipDiagram.querySelector<SVGTextElement>('.bow-label');
  if (bowLabel) {
    bowLabel.textContent = 'BOW';
    bowLabel.setAttribute('x', '75');
    bowLabel.setAttribute('y', '9');
  }

  const directions = [
    { text: 'STERN', x: 75, y: 116, anchor: 'middle' },
    { text: 'PORT', x: 7, y: 63, anchor: 'start' },
    { text: 'STARBOARD', x: 143, y: 63, anchor: 'end' },
  ];

  for (const direction of directions) {
    const label = document.createElementNS(ns, 'text');
    label.setAttribute('x', String(direction.x));
    label.setAttribute('y', String(direction.y));
    label.setAttribute('text-anchor', direction.anchor);
    label.setAttribute('class', 'bow-label');
    label.setAttribute('font-size', direction.text === 'STARBOARD' ? '5.4' : '6');
    label.textContent = direction.text;
    shipDiagram.append(label);
  }
}

if (rudder) {
  rudder.min = '-20';
  rudder.max = '20';
  rudder.step = '1';
  if (Number(rudder.value) < -20 || Number(rudder.value) > 20) rudder.value = '0';
}

function addTickGuide(stack: HTMLElement | null, positions: number[], centerPosition?: number) {
  if (!stack) return;
  const guide = document.createElement('div');
  guide.className = 'slider-tick-guide';
  for (const position of positions) {
    const tick = document.createElement('span');
    tick.className = 'slider-tick';
    if (centerPosition !== undefined && Math.abs(position - centerPosition) < 0.001) tick.classList.add('major-tick');
    tick.style.left = `${position}%`;
    guide.append(tick);
  }
  stack.prepend(guide);
}

// Helm: -20° ... +20° with guides every 5°.
addTickGuide(slipStack, [0, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100], 50);
// Sails: visually useful quarter points.
addTickGuide(windStack, [25, 50, 75], 50);

if (slipIndicator && slipStack) {
  const row = document.createElement('div');
  row.className = 'geo-feedback-row';
  row.innerHTML = `
    <div class="geo-signed-meter" aria-label="Slip angle graphical indicator">
      <span class="geo-zero-line"></span>
      <span id="geo-slip-bar" class="geo-signed-bar"></span>
    </div>
    <span id="geo-slip-value" class="geo-value">0°</span>
  `;
  slipStack.append(row);
}

if (windStack) {
  const speedRow = document.createElement('div');
  speedRow.className = 'geo-feedback-row';
  speedRow.innerHTML = `
    <div class="geo-fill-meter" aria-label="Apparent wind speed graphical indicator">
      <span id="geo-wind-speed-bar" class="geo-fill-bar"></span>
    </div>
    <span id="geo-wind-speed-value" class="geo-value">0.0 kn</span>
  `;

  const angleRow = document.createElement('div');
  angleRow.className = 'geo-feedback-row';
  angleRow.innerHTML = `
    <div class="geo-signed-meter" aria-label="Apparent wind angle graphical indicator">
      <span class="geo-zero-line"></span>
      <span id="geo-wind-angle-bar" class="geo-signed-bar wind-angle"></span>
    </div>
    <span id="geo-wind-angle-value" class="geo-value">0°</span>
  `;

  windStack.append(speedRow, angleRow);
}

const timeControl = document.querySelector<HTMLElement>('.time-control');
const sixteenButton = document.querySelector<HTMLButtonElement>('.time-button[data-time="16"]');
let eightButton: HTMLButtonElement | null = null;
if (timeControl && sixteenButton && !document.querySelector('.time-button[data-time="8"]')) {
  eightButton = document.createElement('button');
  eightButton.className = 'time-button';
  eightButton.dataset.time = '8';
  eightButton.textContent = '8×';
  sixteenButton.before(eightButton);

  eightButton.addEventListener('click', () => {
    const original = sixteenButton.dataset.time;
    sixteenButton.dataset.time = '8';
    sixteenButton.click();
    sixteenButton.dataset.time = original;
    sixteenButton.classList.remove('active');
    eightButton?.classList.add('active');
  });

  timeControl.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('.time-button');
    if (button && button !== eightButton) eightButton?.classList.remove('active');
  });
}

const slipBar = document.querySelector<HTMLElement>('#geo-slip-bar');
const slipValue = document.querySelector<HTMLElement>('#geo-slip-value');
const windSpeedBar = document.querySelector<HTMLElement>('#geo-wind-speed-bar');
const windSpeedValue = document.querySelector<HTMLElement>('#geo-wind-speed-value');
const windAngleBar = document.querySelector<HTMLElement>('#geo-wind-angle-bar');
const windAngleValue = document.querySelector<HTMLElement>('#geo-wind-angle-value');

function setSignedBar(element: HTMLElement | null, value: number, maxMagnitude: number) {
  if (!element) return;
  const clamped = Math.max(-maxMagnitude, Math.min(maxMagnitude, value));
  const halfWidth = Math.abs(clamped) / maxMagnitude * 50;
  element.style.left = `${clamped < 0 ? 50 - halfWidth : 50}%`;
  element.style.width = `${halfWidth}%`;
  element.dataset.side = clamped < -0.01 ? 'port' : clamped > 0.01 ? 'starboard' : 'center';
}

function parseNumber(text: string | undefined) {
  const match = text?.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function update() {
  if (slipIndicator) {
    const left = parseFloat(slipIndicator.style.left || '50');
    const slipDeg = (left - 50) * 0.9;
    setSignedBar(slipBar, slipDeg, 45);
    if (slipValue) slipValue.textContent = slipReadout?.textContent || `${Math.abs(slipDeg).toFixed(1)}°`;
  }

  const apparentSpeed = parseNumber(windReadout?.textContent);
  if (windSpeedBar) windSpeedBar.style.width = `${Math.max(0, Math.min(100, apparentSpeed / 2.5 * 100))}%`;
  if (windSpeedValue) windSpeedValue.textContent = `${apparentSpeed.toFixed(1)} kn`;

  if (windVector) {
    const x2 = Number(windVector.getAttribute('x2') || 75);
    const y2 = Number(windVector.getAttribute('y2') || 60);
    const dx = x2 - 75;
    const forward = 60 - y2;
    const angle = Math.atan2(dx, forward) * 180 / Math.PI;
    setSignedBar(windAngleBar, angle, 180);
    if (windAngleValue) {
      const side = Math.abs(angle) < 1 ? '' : angle < 0 ? ' port' : ' stbd';
      windAngleValue.textContent = `${Math.abs(angle).toFixed(0)}°${side}`;
    }
  }

  requestAnimationFrame(update);
}

requestAnimationFrame(update);
