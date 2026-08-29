import { campaignForMission, campaigns, missionFromUrl, type Campaign } from './missions';
import { voyageForMission } from './expedition-progress';

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
  button.style.pointerEvents = 'auto';
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
        <button id="campaign-menu-back" class="campaign-menu-back" type="button" aria-label="Back to campaigns">‹</button>
        <div class="campaign-menu-heading-copy">
          <p id="campaign-menu-eyebrow" class="campaign-menu-eyebrow">Historical voyages</p>
          <h2 id="campaign-menu-title">Campaigns</h2>
        </div>
        <button class="campaign-menu-close" type="button" aria-label="Close mission selector">×</button>
      </header>
      <div id="campaign-menu-content" class="campaign-menu-content"></div>
    </section>
  `;
  document.body.appendChild(overlay);

  const style = document.createElement('style');
  style.textContent = `
    .campaign-menu-button{pointer-events:auto;border:1px solid rgba(235,208,152,.32);background:rgba(7,24,34,.82);color:#f4efe6;border-radius:999px;padding:.55rem .9rem;font:600 12px/1 system-ui,sans-serif;letter-spacing:.02em;cursor:pointer}
    .campaign-menu-overlay{position:fixed;inset:0;z-index:80;display:none;align-items:center;justify-content:center;padding:20px;touch-action:auto}.campaign-menu-overlay.open{display:flex}.campaign-menu-backdrop{position:absolute;inset:0;background:rgba(2,8,12,.76);backdrop-filter:blur(7px)}
    .campaign-menu-card{position:relative;width:min(760px,96vw);height:min(760px,92vh);max-height:92vh;overflow:hidden;display:flex;flex-direction:column;background:linear-gradient(180deg,rgba(16,45,58,.98),rgba(6,24,34,.99));border:1px solid rgba(234,208,152,.28);border-radius:20px;box-shadow:0 24px 80px rgba(0,0,0,.5);color:#f4efe6;touch-action:auto}
    .campaign-menu-header{flex:0 0 auto;display:grid;grid-template-columns:42px 1fr 42px;align-items:start;gap:10px;padding:22px 22px 16px;border-bottom:1px solid rgba(255,255,255,.1)}.campaign-menu-heading-copy{min-width:0}.campaign-menu-header h2{margin:2px 0 0;font:700 clamp(24px,4vw,38px)/1.05 Georgia,serif}.campaign-menu-eyebrow{margin:0;text-transform:uppercase;letter-spacing:.16em;font:700 10px/1.2 system-ui;color:#d7bc7f}.campaign-menu-close,.campaign-menu-back{border:0;background:transparent;color:#f4efe6;line-height:1;cursor:pointer}.campaign-menu-close{font-size:30px}.campaign-menu-back{font-size:34px;visibility:hidden}.campaign-menu-back.visible{visibility:visible}
    .campaign-menu-content{flex:1 1 auto;min-height:0;overflow:hidden;padding:16px;touch-action:auto}
    .campaign-choice-list{height:100%;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;display:grid;align-content:start;gap:12px;padding-bottom:20px;touch-action:pan-y}
    .campaign-choice{width:100%;display:grid;grid-template-columns:1fr auto;gap:18px;align-items:center;text-align:left;border:1px solid rgba(255,255,255,.11);border-radius:16px;background:rgba(255,255,255,.035);color:#f4efe6;padding:18px;cursor:pointer}.campaign-choice:hover{background:rgba(255,255,255,.065)}.campaign-choice.active-campaign{border-color:rgba(232,185,79,.45);background:rgba(232,185,79,.07)}.campaign-choice span{display:block;font:700 10px/1.2 system-ui;text-transform:uppercase;letter-spacing:.12em;color:#d7bc7f}.campaign-choice h3{margin:5px 0 7px;font:700 21px/1.12 Georgia,serif}.campaign-choice p{margin:0;color:rgba(244,239,230,.66);font:13px/1.45 system-ui}.campaign-choice-count{font:700 12px/1 system-ui;color:#d7bc7f;white-space:nowrap}
    .mission-scroll{height:100%;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;border:1px solid rgba(255,255,255,.1);border-radius:15px;background:rgba(255,255,255,.025);touch-action:pan-y}.mission-row{display:grid;grid-template-columns:38px 1fr auto;align-items:center;gap:12px;width:100%;text-align:left;border:0;border-bottom:1px solid rgba(255,255,255,.065);background:transparent;color:#f4efe6;padding:14px 16px;cursor:pointer}.mission-row:last-child{border-bottom:0}.mission-row:hover{background:rgba(255,255,255,.055)}.mission-row.active-mission{background:rgba(232,185,79,.09)}.mission-number{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.07);font:700 12px/1 system-ui;color:#d7bc7f}.mission-copy{display:grid;gap:3px;min-width:0}.mission-copy strong{font:650 14px/1.2 system-ui}.mission-copy small{font:12px/1.25 system-ui;color:rgba(244,239,230,.58)}.mission-current,.mission-play{font:700 11px/1 system-ui;color:#d7bc7f}.mission-play{opacity:.72}
    @media(max-width:640px){.campaign-menu-overlay{padding:0}.campaign-menu-card{width:100vw;height:100dvh;max-height:100dvh;border-radius:0;border:0}.campaign-menu-header{padding:max(14px,env(safe-area-inset-top)) 12px 12px}.campaign-menu-content{padding:10px 10px max(14px,env(safe-area-inset-bottom))}.campaign-choice{padding:15px}.campaign-choice h3{font-size:19px}.mission-row{grid-template-columns:32px 1fr auto;padding:13px 10px}.campaign-menu-button{padding:.52rem .7rem;font-size:11px}}
  `;
  document.head.appendChild(style);

  const content = overlay.querySelector<HTMLElement>('#campaign-menu-content')!;
  const title = overlay.querySelector<HTMLElement>('#campaign-menu-title')!;
  const eyebrow = overlay.querySelector<HTMLElement>('#campaign-menu-eyebrow')!;
  const back = overlay.querySelector<HTMLButtonElement>('#campaign-menu-back')!;

  function selectMission(missionId: string) {
    const url = new URL(window.location.href);
    url.searchParams.set('mission', missionId);
    window.location.assign(url);
  }

  function renderCampaigns() {
    title.textContent = 'Campaigns';
    eyebrow.textContent = 'Historical voyages';
    back.classList.remove('visible');
    content.innerHTML = `<div class="campaign-choice-list">${campaigns.map((campaign) => `
      <button class="campaign-choice ${campaign.id === activeCampaign.id ? 'active-campaign' : ''}" data-campaign-id="${campaign.id}" type="button">
        <span class="campaign-choice-copy"><span>${campaign.subtitle}</span><h3>${campaign.title}</h3><p>${campaign.description}</p></span>
        <span class="campaign-choice-count">${campaign.missions.filter((mission) => voyageForMission(mission.id)).length} / ${campaign.missions.length} completed ›</span>
      </button>
    `).join('')}</div>`;
    content.querySelectorAll<HTMLButtonElement>('.campaign-choice').forEach((choice) => {
      choice.addEventListener('click', () => {
        const campaign = campaigns.find((candidate) => candidate.id === choice.dataset.campaignId);
        if (campaign) renderMissions(campaign);
      });
    });
  }

  function renderMissions(campaign: Campaign) {
    title.textContent = campaign.title;
    eyebrow.textContent = `${campaign.subtitle} · ${campaign.missions.length} ${campaign.missions.length === 1 ? 'mission' : 'missions'}`;
    back.classList.add('visible');
    content.innerHTML = `<div class="mission-scroll">${campaign.missions.map((mission) => `
      <button class="mission-row ${mission.id === activeMission.id ? 'active-mission' : ''}" data-mission-id="${mission.id}" type="button">
        <span class="mission-number">${voyageForMission(mission.id) ? '✓' : mission.number}</span>
        <span class="mission-copy"><strong>${mission.title}</strong><small>${mission.from} → ${mission.to}</small></span>
        ${mission.id === activeMission.id ? '<span class="mission-current">Current</span>' : voyageForMission(mission.id) ? '<span class="mission-play">Replay ›</span>' : '<span class="mission-play">Sail ›</span>'}
      </button>
    `).join('')}</div>`;
    content.querySelectorAll<HTMLButtonElement>('.mission-row').forEach((row) => {
      row.addEventListener('click', () => {
        const missionId = row.dataset.missionId;
        if (missionId) selectMission(missionId);
      });
    });
    requestAnimationFrame(() => {
      content.querySelector('.active-mission')?.scrollIntoView({ block: 'center' });
    });
  }

  const open = () => {
    renderCampaigns();
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
  };
  const close = () => {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
  };

  button.addEventListener('click', open);
  back.addEventListener('click', renderCampaigns);
  overlay.querySelector('.campaign-menu-close')?.addEventListener('click', close);
  overlay.querySelector('.campaign-menu-backdrop')?.addEventListener('click', close);
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && overlay.classList.contains('open')) close();
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountCampaignMenu, { once: true });
else mountCampaignMenu();
