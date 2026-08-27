import './ship-forces-tweak.css';

const panel = document.querySelector<HTMLElement>('.ship-vector-panel');
const diagram = document.querySelector<SVGElement>('#ship-diagram');

if (panel && diagram) {
  const panelHeading = panel.querySelector<HTMLElement>('.vector-panel-heading');
  if (panelHeading) panelHeading.innerHTML = '<span>Heading</span><strong id="forces-heading">0°</strong>';

  const readouts = document.createElement('div');
  readouts.className = 'force-readouts';
  readouts.innerHTML = `
    <div class="force-readout wind-force-readout">
      <span class="force-label">Wind</span>
      <span class="force-line"></span>
      <span class="force-speed" id="forces-wind-speed">0.0 kn</span>
      <span class="force-angle" id="forces-wind-angle">0°</span>
    </div>
    <div class="force-readout current-force-readout">
      <span class="force-label">Current</span>
      <span class="force-line"></span>
      <span class="force-speed" id="forces-current-speed">0.00 kn</span>
      <span class="force-angle" id="forces-current-angle">0°</span>
    </div>
    <div class="force-readout track-force-readout">
      <span class="force-label">Track</span>
      <span class="force-line"></span>
      <span class="force-speed" id="forces-track-speed">0.00 kn</span>
      <span class="force-angle" id="forces-track-angle">0°</span>
    </div>
  `;
  panel.append(readouts);

  const text = (selector: string) => document.querySelector<HTMLElement>(selector)?.textContent?.trim() ?? '';
  const normalizeDegrees = (value: number) => ((value % 360) + 360) % 360;
  const signedAngleDifference = (target: number, reference: number) => {
    const difference = ((target - reference + 540) % 360) - 180;
    return Math.abs(difference + 180) < 0.0001 ? 180 : difference;
  };
  const formatSignedAngle = (angle: number) => {
    const rounded = Math.round(angle);
    if (rounded === 0) return '0°';
    return `${rounded > 0 ? '+' : ''}${rounded}°`;
  };

  function trackBearing() {
    const line = document.querySelector<SVGLineElement>('#track-vector');
    const heading = Number.parseFloat(text('#heading')) || 0;
    if (!line) return heading;

    const dx = Number(line.getAttribute('x2') ?? 75) - 75;
    const dy = 60 - Number(line.getAttribute('y2') ?? 60);
    if (Math.hypot(dx, dy) < 0.001) return heading;

    const relative = Math.atan2(dx, dy) * 180 / Math.PI;
    return normalizeDegrees(heading + relative);
  }

  function update() {
    const heading = text('#heading') || '0°';
    const headingDeg = Number.parseFloat(heading) || 0;
    const speed = text('#speed') || '0.00 kn';
    const windSpeed = text('#wind') || '0.0';
    const windTowardBearing = Number.parseFloat(text('#wind-bearing')) || 0;
    const windFromBearing = normalizeDegrees(windTowardBearing + 180);
    const windRelativeAngle = signedAngleDifference(windFromBearing, headingDeg);
    const currentSpeed = text('#current') || '0.00';
    const currentBearing = text('#current-bearing') || '0°';

    const set = (selector: string, value: string) => {
      const target = document.querySelector<HTMLElement>(selector);
      if (target) target.textContent = value;
    };

    set('#forces-heading', heading);
    set('#forces-wind-speed', `${windSpeed} kn`);
    set('#forces-wind-angle', formatSignedAngle(windRelativeAngle));
    set('#forces-current-speed', `${currentSpeed} kn`);
    set('#forces-current-angle', currentBearing);
    set('#forces-track-speed', speed);
    set('#forces-track-angle', `${trackBearing().toFixed(0)}°`);
  }

  const observer = new MutationObserver(update);
  ['#heading', '#speed', '#wind', '#wind-bearing', '#current', '#current-bearing', '#track-vector'].forEach((selector) => {
    const node = document.querySelector(selector);
    if (node) observer.observe(node, { attributes: true, childList: true, characterData: true, subtree: true });
  });

  update();
}
