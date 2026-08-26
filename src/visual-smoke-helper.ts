import { runBiscaySailingRegression } from './sailing-regression';

const smokeMode = new URLSearchParams(window.location.search).get('visual-smoke');

if (smokeMode) {
  requestAnimationFrame(() => {
    document.querySelector<HTMLElement>('#modal')?.classList.remove('open');
  });

  if (smokeMode === 'deep') {
    // Exercise a much deeper zoom so CI verifies the 10m coastline and
    // zoom-aware marker layers well beyond the default tutorial scale.
    window.setTimeout(() => {
      const canvas = document.querySelector<HTMLCanvasElement>('#ocean');
      const shell = document.querySelector<HTMLElement>('.game-shell');
      if (!canvas || !shell) return;
      const rect = shell.getBoundingClientRect();
      canvas.dispatchEvent(new WheelEvent('wheel', {
        clientX: rect.left + rect.width * 0.5,
        clientY: rect.top + rect.height * 0.5,
        deltaY: -1600,
        bubbles: true,
        cancelable: true,
      }));
    }, 700);
  }

  if (smokeMode === 'sailing') {
    window.setTimeout(() => {
      const sails = document.querySelector<HTMLInputElement>('#sails');
      if (sails) {
        sails.value = '100';
        sails.dispatchEvent(new Event('input', { bubbles: true }));
      }

      const results = runBiscaySailingRegression();
      const panel = document.createElement('section');
      panel.id = 'sailing-regression-panel';
      panel.setAttribute('aria-label', 'Bay of Biscay sailing regression matrix');
      panel.style.cssText = [
        'position:absolute',
        'left:16px',
        'right:16px',
        'top:200px',
        'z-index:50',
        'background:rgba(5,24,34,.94)',
        'border:1px solid rgba(255,255,255,.22)',
        'border-radius:14px',
        'padding:12px',
        'color:#f4efe6',
        'font:12px/1.35 system-ui,sans-serif',
        'max-height:52%',
        'overflow:auto',
      ].join(';');

      panel.innerHTML = `
        <strong style="display:block;font-size:14px;margin-bottom:8px">Biscay sailing regression</strong>
        <div style="display:grid;grid-template-columns:1.4fr .8fr .8fr .8fr;gap:5px;font-size:10px;opacity:.7;margin-bottom:5px">
          <span>Case</span><span>Angle</span><span>Water</span><span>Ground</span>
        </div>
        ${results.map((result) => `
          <div data-test-id="${result.id}" data-pass="${result.pass}" style="display:grid;grid-template-columns:1.4fr .8fr .8fr .8fr;gap:5px;padding:5px 0;border-top:1px solid rgba(255,255,255,.08)">
            <span>${result.pass ? '✓' : '✗'} ${result.place}<br><small style="opacity:.72">${result.actualPointOfSail}</small></span>
            <span>${result.relativeWindAngleDeg.toFixed(0)}°</span>
            <span>${result.throughWaterSpeedKn.toFixed(2)} kn</span>
            <span>${result.groundSpeedKn.toFixed(2)} kn</span>
          </div>
        `).join('')}
      `;

      document.querySelector<HTMLElement>('.game-shell')?.append(panel);
      document.documentElement.dataset.sailingRegression = results.every((result) => result.pass) ? 'pass' : 'fail';
    }, 800);
  }
}
