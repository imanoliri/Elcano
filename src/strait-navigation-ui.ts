import './strait-navigation-ui.css';
import { straitAnchorages, straitPassageCondition } from './world/strait-navigation';
import { windAt } from './world/environment';
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
    const condition = straitPassageCondition(state.ship.position, state.time, windAt(state.ship.position, state.time));
    modal.querySelector<HTMLElement>('[data-strait-condition]')!.innerHTML = condition
      ? `<strong>${condition.zone?.name ?? 'Central Strait'}</strong><b>${condition.phase} · ${condition.speed.toFixed(1)} kn</b><span>Channel wind ${Math.hypot(condition.wind.x, condition.wind.y).toFixed(0)} kn${condition.gusty ? ' · gusts likely' : ''}.</span>`
      : '';
    modal.classList.add('open');
  };
  modal.querySelector('.strait-close')!.addEventListener('click', close);
  modal.querySelector('.strait-backdrop')!.addEventListener('click', close);
  window.addEventListener('elcano:open-strait-conditions', open);
}
