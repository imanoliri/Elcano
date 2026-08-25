import './telemetry-ui.css';

const slipIndicator = document.querySelector<HTMLElement>('#slip-indicator');
const slipReadout = document.querySelector<HTMLElement>('#slip-readout');
const slipStack = document.querySelector<HTMLElement>('.slip-stack');
const windStack = document.querySelector<HTMLElement>('.wind-stack');
const windReadout = document.querySelector<HTMLElement>('#apparent-wind-readout');
const windVector = document.querySelector<SVGLineElement>('#relative-wind-vector');

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
