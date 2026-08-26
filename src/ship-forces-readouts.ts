import './ship-forces-tweak.css';

const panel = document.querySelector<HTMLElement>('.ship-vector-panel');
const diagram = document.querySelector<SVGElement>('#ship-diagram');

if (panel && diagram) {
  const headingReadout = document.createElement('div');
  headingReadout.className = 'ship-heading-readout';
  headingReadout.innerHTML = '<span>Heading</span><strong id="forces-heading">0°</strong>';
  diagram.insertAdjacentElement('afterend', headingReadout);

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

  function trackBearing() {
    const line = document.querySelector<SVGLineElement>('#track-vector');
    const heading = Number.parseFloat(text('#heading')) || 0;
    if (!line) return heading;

    const dx = Number(line.getAttribute('x2') ?? 75) - 75;
    const dy = 60 - Number(line.getAttribute('y2') ?? 60);
    if (Math.hypot(dx, dy) < 0.001) return heading;

    const relative = Math.atan2(dx, dy) * 180 / Math.PI;
    return (heading + relative + 360) % 360;
  }

  function update() {
    const heading = text('#heading') || '0°';
    const speed = text('#speed') || '0.00 kn';
    const windSpeed = text('#wind') || '0.0';
    const windBearing = text('#wind-bearing') || '0°';
    const currentSpeed = text('#current') || '0.00';
    const currentBearing = text('#current-bearing') || '0°';

    const set = (selector: string, value: string) => {
      const target = document.querySelector<HTMLElement>(selector);
      if (target) target.textContent = value;
    };

    set('#forces-heading', heading);
    set('#forces-wind-speed', `${windSpeed} kn`);
    set('#forces-wind-angle', windBearing);
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
