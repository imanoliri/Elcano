import { allMissions, missionFromUrl } from './missions';
import { shipPresetFromId } from './ship-selection';
import { createKeyboardControlsPanel } from './keyboard-controls';

const params = new URLSearchParams(window.location.search);
if (params.get('play') === '1') {
  const activeMission = missionFromUrl();
  const activeShip = shipPresetFromId(params.get('ship'));
  const index = allMissions.findIndex((mission) => mission.id === activeMission.id);
  const previous = index > 0 ? allMissions[index - 1] : null;
  const next = index >= 0 && index < allMissions.length - 1 ? allMissions[index + 1] : null;

  function goToMission(missionId: string) {
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('mission', missionId);
    url.searchParams.set('ship', activeShip.id);
    url.searchParams.set('play', '1');
    window.location.assign(url);
  }

  function exitMission() {
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('mission', activeMission.id);
    url.searchParams.set('ship', activeShip.id);
    window.location.assign(url);
  }

  const topActions = document.querySelector<HTMLElement>('.top-actions');
  if (topActions) {
    topActions.querySelector('#campaign-menu-button')?.remove();
    topActions.querySelector('#ship-selector-button')?.remove();
    topActions.querySelector('#reset')?.remove();
    topActions.querySelector('#help')?.remove();
    topActions.querySelector('#sailing-info')?.remove();

    const menuButton = document.createElement('button');
    menuButton.id = 'game-menu-button';
    menuButton.className = 'icon-button';
    menuButton.type = 'button';
    menuButton.textContent = '☰';
    menuButton.setAttribute('aria-label', 'Mission menu');
    topActions.appendChild(menuButton);

    const gameplayActions = document.createElement('div');
    gameplayActions.className = 'gameplay-action-row';
    topActions.querySelectorAll<HTMLElement>(':scope > .camera-mode-button, :scope > .route-actions').forEach((control) => gameplayActions.appendChild(control));
    if (gameplayActions.childElementCount > 0) topActions.appendChild(gameplayActions);

    const overlay = document.createElement('div');
    overlay.className = 'game-menu-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <div class="game-menu-backdrop"></div>
      <section class="game-menu-card" role="dialog" aria-modal="true" aria-labelledby="game-menu-title">
        <button class="game-menu-close" type="button" aria-label="Close menu">×</button>
        <p class="game-menu-kicker">Mission ${activeMission.number}</p>
        <h2 id="game-menu-title">${activeMission.title}</h2>
        <p class="game-menu-route">${activeMission.from} → ${activeMission.to}</p>
        <p class="game-menu-ship">⛵ ${activeShip.name} · ${activeShip.rigLabel}</p>
        <div class="game-menu-actions">
          <button id="game-resume" class="game-menu-primary" type="button">Resume</button>
          <div class="game-menu-nav game-menu-info-row">
            <button id="game-briefing" type="button">Mission briefing</button>
            <button id="game-sailing-guide" type="button">Sailing guide</button>
          </div>
          ${activeMission.isStraitPassage ? '<button id="game-strait-conditions" type="button">Strait passage conditions</button>' : ''}
          <details class="game-menu-visibility">
            <summary>Navigation display</summary>
            <div class="game-menu-visibility-options">
            <label><input id="show-heading-vector" type="checkbox" checked> Heading vector</label>
            <label><input id="show-track-vector" type="checkbox" checked> Track vector</label>
            <label><input id="show-course-trail" type="checkbox" checked> Course trail</label>
            <label><input id="show-wind-field" type="checkbox" checked> Wind field</label>
            <label><input id="show-current-field" type="checkbox" checked> Current field</label>
            </div>
          </details>
          <div id="game-keyboard-controls"></div>
          <button id="game-restart" type="button">Restart mission</button>
          <div class="game-menu-nav">
            <button id="game-previous" type="button" ${previous ? '' : 'disabled'}>← Previous mission</button>
            <button id="game-next" type="button" ${next ? '' : 'disabled'}>Next mission →</button>
          </div>
          <button id="game-exit" class="game-menu-exit" type="button">Exit to voyage menu</button>
        </div>
      </section>
    `;
    document.body.appendChild(overlay);

    const style = document.createElement('style');
    style.textContent = `
      .top-actions{display:grid;justify-items:end;align-items:start;gap:8px}.gameplay-action-row{display:flex;justify-content:flex-end;align-items:center;gap:8px}.gameplay-action-row .route-actions{display:flex;gap:8px}
      .game-menu-overlay{position:fixed;inset:0;z-index:160;display:none;place-items:center;padding:18px}.game-menu-overlay.open{display:grid}.game-menu-backdrop{position:absolute;inset:0;background:rgba(2,9,14,.72);backdrop-filter:blur(7px)}
      .game-menu-card{position:relative;width:min(460px,100%);max-height:calc(100dvh - 36px);overflow-y:auto;overscroll-behavior:contain;padding:28px;border:1px solid rgba(255,255,255,.14);border-radius:22px;background:linear-gradient(145deg,rgba(13,43,56,.99),rgba(5,19,28,.99));box-shadow:0 25px 80px rgba(0,0,0,.55);color:#f4efe6}.game-menu-close{position:absolute;right:14px;top:14px;width:38px;height:38px;border:0;border-radius:50%;background:rgba(255,255,255,.08);color:#f4efe6;font-size:1.5rem}.game-menu-kicker{margin:0;color:#d7bc7f;font:800 10px/1 system-ui;letter-spacing:.15em;text-transform:uppercase}.game-menu-card h2{margin:7px 44px 5px 0;font:700 32px/1.05 Georgia,serif}.game-menu-route{margin:0;opacity:.68}.game-menu-ship{margin:18px 0 0;padding:11px 12px;border-radius:11px;background:rgba(255,255,255,.05);font-size:.82rem;color:#ead098}
      .game-menu-actions{display:grid;gap:9px;margin-top:20px}.game-menu-actions button{border:1px solid rgba(255,255,255,.14);border-radius:11px;background:rgba(255,255,255,.055);color:#f4efe6;padding:12px 14px;font-weight:700}.game-menu-actions button:disabled{opacity:.3;cursor:default}.game-menu-actions .game-menu-primary{background:#e8b94f;color:#17202a;border-color:transparent}.game-menu-nav{display:grid;grid-template-columns:1fr 1fr;gap:9px}.game-menu-info-row button{font-size:.8rem}.game-menu-actions .game-menu-exit{margin-top:5px;border-color:rgba(232,185,79,.35);color:#e8c46c}
      .game-menu-visibility{margin:3px 0;border:1px solid rgba(255,255,255,.12);border-radius:11px;background:rgba(255,255,255,.035)}.game-menu-visibility summary{padding:12px;cursor:pointer;color:#d7bc7f;font-size:.7rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.game-menu-visibility-options{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 12px 12px}.game-menu-visibility label{display:flex;align-items:center;gap:7px;min-width:0;font-size:.76rem}.game-menu-visibility input{width:17px;height:17px;accent-color:#e8b94f;flex:none}@media(max-width:420px){.game-menu-visibility-options{grid-template-columns:1fr}.game-menu-card{padding:22px}}
    `;
    document.head.appendChild(style);

    const open = () => { overlay.classList.add('open'); overlay.setAttribute('aria-hidden', 'false'); };
    const close = () => { overlay.classList.remove('open'); overlay.setAttribute('aria-hidden', 'true'); };
    const openExistingModal = (selector: string) => {
      const modal = document.querySelector<HTMLElement>(selector);
      if (!modal) return;
      close();
      modal.classList.add('open');
    };
    const sendNavigationVisibility = () => {
      window.dispatchEvent(new CustomEvent('elcano:navigation-visibility', {
        detail: {
          heading: overlay.querySelector<HTMLInputElement>('#show-heading-vector')!.checked,
          track: overlay.querySelector<HTMLInputElement>('#show-track-vector')!.checked,
          trail: overlay.querySelector<HTMLInputElement>('#show-course-trail')!.checked,
          wind: overlay.querySelector<HTMLInputElement>('#show-wind-field')!.checked,
          current: overlay.querySelector<HTMLInputElement>('#show-current-field')!.checked,
        },
      }));
    };

    menuButton.addEventListener('click', open);
    overlay.querySelector('.game-menu-backdrop')!.addEventListener('click', close);
    overlay.querySelector('.game-menu-close')!.addEventListener('click', close);
    overlay.querySelector('#game-resume')!.addEventListener('click', close);
    overlay.querySelector('#game-briefing')!.addEventListener('click', () => openExistingModal('#modal'));
    overlay.querySelector('#game-sailing-guide')!.addEventListener('click', () => openExistingModal('#sailing-guide-modal'));
    overlay.querySelector('#game-strait-conditions')?.addEventListener('click', () => { close(); window.dispatchEvent(new CustomEvent('elcano:open-strait-conditions')); });
    overlay.querySelector('#game-keyboard-controls')!.append(createKeyboardControlsPanel());
    overlay.querySelector('#game-restart')!.addEventListener('click', () => window.location.reload());
    overlay.querySelector('#game-exit')!.addEventListener('click', exitMission);
    overlay.querySelector('#game-previous')!.addEventListener('click', () => previous && goToMission(previous.id));
    overlay.querySelector('#game-next')!.addEventListener('click', () => next && goToMission(next.id));
    overlay.querySelectorAll<HTMLInputElement>('.game-menu-visibility input').forEach((input) => input.addEventListener('change', sendNavigationVisibility));
    window.addEventListener('keydown', (event) => { if (event.key === 'Escape' && overlay.classList.contains('open')) close(); });
    window.addEventListener('elcano:open-game-menu', open);
  }
}
