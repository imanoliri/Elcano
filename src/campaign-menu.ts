import { campaignForMission, campaigns, missionFromUrl } from './missions';

const activeMission = missionFromUrl();
const activeCampaign = campaignForMission(activeMission);

function mountCampaignMenu() {
  const topActions = document.querySelector<HTMLElement>('.top-actions');
  if (!topActions || document.querySelector('#campaign-menu-button')) return;

  const button = document.createElement('button');
  button.id = 'campaign-menu-button';
  button.className = 'campaign-menu-button';
  button.type = 'button';
  button.textContent = 'Missions';
  button.setAttribute('aria-label', 'Select campaign and mission');
  topActions.prepend(button);

  const overlay = document.createElement('div');
  overlay.id = 'campaign-menu-overlay';
  overlay.className = 'campaign-menu-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <div class="campaign-menu-backdrop"></div>
    <section class="campaign-menu-card" role="dialog" aria-modal="true" aria-labelledby="campaign-menu-title">
      <header class="campaign-menu-header">
        <div>
          <p class="campaign-menu-eyebrow">Historical voyages</p>
          <h2 id="campaign-menu-title">Campaigns & missions</h2>
        </div>
        <button class="campaign-menu-close" type="button" aria-label="Close mission selector">×</button>
      </header>
      <div class="campaign-list">
        ${campaigns.map((campaign) => `
          <section class="campaign-section ${campaign.id === activeCampaign.id ? 'active-campaign' : ''}">
            <div class="campaign-heading">
              <div><span>${campaign.subtitle}</span><h3>${campaign.title}</h3></div>
              <p>${campaign.description}</p>
            </div>
            <div class="mission-list">
              ${campaign.missions.map((mission) => `
                <button class="mission-row ${mission.id === activeMission.id ? 'active-mission' : ''}" data-mission-id="${mission.id}" type="button">
                  <span class="mission-number">${mission.number}</span>
                  <span class="mission-copy"><strong>${mission.title}</strong><small>${mission.from} → ${mission.to}</small></span>
                  ${mission.id === activeMission.id ? '<span class="mission-current">Current</span>' : '<span class="mission-play">Sail ›</span>'}
                </button>
              `).join('')}
            </div>
          </section>
        `).join('')}
      </div>
    </section>
  `;
  document.body.appendChild(overlay);

  const style = document.createElement('style');
  style.textContent = `
    .campaign-menu-button{border:1px solid rgba(235,208,152,.32);background:rgba(7,24,34,.82);color:#f4efe6;border-radius:999px;padding:.55rem .9rem;font:600 12px/1 system-ui,sans-serif;letter-spacing:.02em;cursor:pointer}
    .campaign-menu-overlay{position:fixed;inset:0;z-index:80;display:none;align-items:center;justify-content:center;padding:20px}.campaign-menu-overlay.open{display:flex}.campaign-menu-backdrop{position:absolute;inset:0;background:rgba(2,8,12,.76);backdrop-filter:blur(7px)}
    .campaign-menu-card{position:relative;width:min(900px,96vw);max-height:min(820px,92vh);overflow:hidden;display:flex;flex-direction:column;background:linear-gradient(180deg,rgba(16,45,58,.98),rgba(6,24,34,.99));border:1px solid rgba(234,208,152,.28);border-radius:20px;box-shadow:0 24px 80px rgba(0,0,0,.5);color:#f4efe6}
    .campaign-menu-header{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;padding:24px 26px 18px;border-bottom:1px solid rgba(255,255,255,.1)}.campaign-menu-header h2{margin:2px 0 0;font:700 clamp(24px,4vw,38px)/1.05 Georgia,serif}.campaign-menu-eyebrow{margin:0;text-transform:uppercase;letter-spacing:.16em;font:700 10px/1.2 system-ui;color:#d7bc7f}.campaign-menu-close{border:0;background:transparent;color:#f4efe6;font-size:30px;line-height:1;cursor:pointer}
    .campaign-list{overflow:auto;padding:18px 20px 24px;display:grid;gap:18px}.campaign-section{border:1px solid rgba(255,255,255,.1);border-radius:15px;background:rgba(255,255,255,.025);overflow:hidden}.campaign-section.active-campaign{border-color:rgba(232,185,79,.38)}.campaign-heading{padding:17px 18px 14px;display:grid;grid-template-columns:minmax(210px,.75fr) 1.25fr;gap:20px;border-bottom:1px solid rgba(255,255,255,.08)}.campaign-heading span{font:700 10px/1.2 system-ui;text-transform:uppercase;letter-spacing:.12em;color:#d7bc7f}.campaign-heading h3{margin:4px 0 0;font:700 19px/1.15 Georgia,serif}.campaign-heading p{margin:0;color:rgba(244,239,230,.7);font:13px/1.45 system-ui}
    .mission-list{display:grid}.mission-row{display:grid;grid-template-columns:38px 1fr auto;align-items:center;gap:12px;width:100%;text-align:left;border:0;border-bottom:1px solid rgba(255,255,255,.065);background:transparent;color:#f4efe6;padding:13px 16px;cursor:pointer}.mission-row:last-child{border-bottom:0}.mission-row:hover{background:rgba(255,255,255,.055)}.mission-row.active-mission{background:rgba(232,185,79,.09)}.mission-number{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.07);font:700 12px/1 system-ui;color:#d7bc7f}.mission-copy{display:grid;gap:3px}.mission-copy strong{font:650 14px/1.2 system-ui}.mission-copy small{font:12px/1.25 system-ui;color:rgba(244,239,230,.58)}.mission-current,.mission-play{font:700 11px/1 system-ui;color:#d7bc7f}.mission-play{opacity:.72}
    @media(max-width:640px){.campaign-menu-overlay{padding:8px}.campaign-menu-card{max-height:96vh;border-radius:14px}.campaign-menu-header{padding:18px}.campaign-list{padding:12px}.campaign-heading{grid-template-columns:1fr;gap:8px}.mission-row{grid-template-columns:32px 1fr auto;padding:12px 10px}.campaign-menu-button{padding:.52rem .7rem;font-size:11px}}
  `;
  document.head.appendChild(style);

  const open = () => { overlay.classList.add('open'); overlay.setAttribute('aria-hidden', 'false'); };
  const close = () => { overlay.classList.remove('open'); overlay.setAttribute('aria-hidden', 'true'); };

  button.addEventListener('click', open);
  overlay.querySelector('.campaign-menu-close')?.addEventListener('click', close);
  overlay.querySelector('.campaign-menu-backdrop')?.addEventListener('click', close);
  overlay.querySelectorAll<HTMLButtonElement>('.mission-row').forEach((row) => {
    row.addEventListener('click', () => {
      const missionId = row.dataset.missionId;
      if (!missionId) return;
      const url = new URL(window.location.href);
      url.searchParams.set('mission', missionId);
      window.location.assign(url);
    });
  });
  window.addEventListener('keydown', (event) => { if (event.key === 'Escape' && overlay.classList.contains('open')) close(); });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountCampaignMenu, { once: true });
else mountCampaignMenu();
