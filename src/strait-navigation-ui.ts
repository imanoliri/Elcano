import './strait-navigation-ui.css';
import { straitAnchorages, straitTideDescription } from './world/strait-navigation';
import type { WorldState } from './simulation';

export function installStraitNavigationUi(getState: () => WorldState, active: boolean) {
  if (!active) return;
  const modal = document.createElement('div');
  modal.className = 'strait-modal';
  modal.innerHTML = `<div class="strait-backdrop"></div><section class="strait-card" role="dialog" aria-modal="true" aria-labelledby="strait-title"><button type="button" class="strait-close" aria-label="Close passage conditions">×</button><p>MAGELLAN'S STRAIT · LOCAL CHART</p><h2 id="strait-title">Passage conditions</h2><div data-strait-condition></div><h3>Sheltered anchorages</h3><ul>${straitAnchorages.map((anchorage) => `<li>⚓ ${anchorage.name}</li>`).join('')}</ul><small>Currents reverse independently by channel. Wait in a sheltered bay, then use a westbound tide through the next narrow section.</small></section>`;
  document.body.append(modal);
  const close = () => modal.classList.remove('open');
  const open = () => {
    const state = getState();
    const condition = straitTideDescription(state.ship.position, state.time);
    modal.querySelector<HTMLElement>('[data-strait-condition]')!.innerHTML = condition
      ? `<strong>${condition.zone.name}</strong><b>${condition.phase} · ${condition.speed.toFixed(1)} kn</b><span>${condition.favourableInHours === 0 ? 'This is a favourable westbound window.' : `A westbound window returns in about ${condition.favourableInHours} hours.`}</span>`
      : '<strong>Open water</strong><span>Chart the next narrow channel to read its local tide.</span>';
    modal.classList.add('open');
  };
  modal.querySelector('.strait-close')!.addEventListener('click', close);
  modal.querySelector('.strait-backdrop')!.addEventListener('click', close);
  window.addEventListener('elcano:open-strait-conditions', open);
}
