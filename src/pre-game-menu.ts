import { campaigns, missionFromUrl, type Campaign, type Mission } from './missions';
import { SHIP_PRESETS, shipPresetFromId, type ShipPreset } from './ship-selection';

const params = new URLSearchParams(window.location.search);
const isPlaying = params.get('play') === '1';

if (!isPlaying) {
  const activeMission = missionFromUrl();
  let selectedCampaign: Campaign = campaigns.find((campaign) => campaign.missions.some((mission) => mission.id === activeMission.id)) ?? campaigns[0];
  let selectedMission: Mission = activeMission;
  let selectedShip: ShipPreset = shipPresetFromId(params.get('ship'));

  const overlay = document.createElement('div');
  overlay.className = 'pre-game-menu';
  overlay.innerHTML = `
    <main class="pre-game-card">
      <header class="pre-game-header">
        <div><p class="pre-game-kicker">ELCANO</p><h1>Choose your voyage</h1></div>
        <p>Pick a mission and ship before taking the helm.</p>
      </header>
      <section class="pre-game-section">
        <h2>Campaign</h2>
        <div id="pre-campaigns" class="pre-campaigns"></div>
      </section>
      <section class="pre-game-section">
        <h2>Mission</h2>
        <div id="pre-missions" class="pre-missions"></div>
      </section>
      <section class="pre-game-section">
        <h2>Ship</h2>
        <div id="pre-ships" class="pre-ships"></div>
      </section>
      <footer class="pre-game-footer">
        <div id="pre-summary" class="pre-summary"></div>
        <button id="pre-start" class="pre-start" type="button">Start voyage</button>
      </footer>
    </main>
  `;
  document.body.appendChild(overlay);

  const style = document.createElement('style');
  style.textContent = `
    .pre-game-menu{position:fixed;inset:0;z-index:200;background:radial-gradient(circle at 50% 15%,#174b5f 0,#0b2d3d 38%,#06131b 100%);overflow:auto;color:#f4efe6}
    .pre-game-card{width:min(980px,calc(100% - 32px));margin:0 auto;padding:clamp(28px,6vw,64px) 0 48px}.pre-game-header{display:flex;justify-content:space-between;gap:32px;align-items:end;margin-bottom:32px}.pre-game-header h1{margin:4px 0 0;font:700 clamp(36px,7vw,68px)/.95 Georgia,serif}.pre-game-header>p{max-width:320px;margin:0;opacity:.68;line-height:1.5}.pre-game-kicker{margin:0;color:#d7bc7f;font:800 11px/1 system-ui;letter-spacing:.22em}
    .pre-game-section{margin:24px 0}.pre-game-section h2{margin:0 0 10px;font:700 12px/1 system-ui;text-transform:uppercase;letter-spacing:.14em;color:#d7bc7f}
    .pre-campaigns,.pre-ships{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px}.pre-missions{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:8px;max-height:310px;overflow:auto;padding-right:3px}
    .pre-choice{border:1px solid rgba(255,255,255,.12);border-radius:14px;background:rgba(255,255,255,.035);color:#f4efe6;padding:14px;text-align:left;cursor:pointer}.pre-choice:hover{background:rgba(255,255,255,.065)}.pre-choice.active{border-color:rgba(232,185,79,.7);background:rgba(232,185,79,.1);box-shadow:inset 0 0 0 1px rgba(232,185,79,.12)}.pre-choice strong,.pre-choice span,.pre-choice small{display:block}.pre-choice strong{font-size:.92rem}.pre-choice span{margin-top:4px;color:#d7bc7f;font-size:.68rem}.pre-choice small{margin-top:6px;opacity:.58;line-height:1.35}
    .pre-mission{display:grid;grid-template-columns:34px 1fr;gap:9px;align-items:start}.pre-mission-number{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.07);color:#d7bc7f;font-weight:800;font-size:.72rem}
    .pre-game-footer{position:sticky;bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:18px;margin-top:28px;padding:14px 16px;border:1px solid rgba(255,255,255,.12);border-radius:16px;background:rgba(4,16,24,.9);backdrop-filter:blur(16px);box-shadow:0 16px 50px rgba(0,0,0,.35)}.pre-summary{min-width:0}.pre-summary strong,.pre-summary small{display:block}.pre-summary small{margin-top:3px;opacity:.58}.pre-start{flex:0 0 auto;border:0;border-radius:12px;background:#e8b94f;color:#17202a;padding:13px 20px;font-weight:900}
    @media(max-width:650px){.pre-game-card{width:min(100% - 20px,980px);padding-top:26px}.pre-game-header{display:block}.pre-game-header>p{margin-top:12px}.pre-campaigns,.pre-ships{display:flex;overflow-x:auto}.pre-campaigns .pre-choice,.pre-ships .pre-choice{flex:0 0 180px}.pre-missions{grid-template-columns:1fr;max-height:280px}.pre-game-footer{bottom:8px}.pre-summary small{display:none}}
  `;
  document.head.appendChild(style);

  const campaignsEl = overlay.querySelector<HTMLElement>('#pre-campaigns')!;
  const missionsEl = overlay.querySelector<HTMLElement>('#pre-missions')!;
  const shipsEl = overlay.querySelector<HTMLElement>('#pre-ships')!;
  const summaryEl = overlay.querySelector<HTMLElement>('#pre-summary')!;

  function render() {
    campaignsEl.innerHTML = campaigns.map((campaign) => `
      <button class="pre-choice ${campaign.id === selectedCampaign.id ? 'active' : ''}" data-campaign="${campaign.id}" type="button">
        <strong>${campaign.title}</strong><span>${campaign.subtitle}</span><small>${campaign.description}</small>
      </button>
    `).join('');
    campaignsEl.querySelectorAll<HTMLButtonElement>('[data-campaign]').forEach((button) => button.addEventListener('click', () => {
      const campaign = campaigns.find((candidate) => candidate.id === button.dataset.campaign);
      if (!campaign) return;
      selectedCampaign = campaign;
      selectedMission = campaign.missions[0];
      render();
    }));

    missionsEl.innerHTML = selectedCampaign.missions.map((mission) => `
      <button class="pre-choice pre-mission ${mission.id === selectedMission.id ? 'active' : ''}" data-mission="${mission.id}" type="button">
        <span class="pre-mission-number">${mission.number}</span><span><strong>${mission.title}</strong><span>${mission.from} → ${mission.to}</span><small>${mission.date}</small></span>
      </button>
    `).join('');
    missionsEl.querySelectorAll<HTMLButtonElement>('[data-mission]').forEach((button) => button.addEventListener('click', () => {
      const mission = selectedCampaign.missions.find((candidate) => candidate.id === button.dataset.mission);
      if (mission) { selectedMission = mission; render(); }
    }));

    shipsEl.innerHTML = SHIP_PRESETS.map((ship) => `
      <button class="pre-choice ${ship.id === selectedShip.id ? 'active' : ''}" data-ship="${ship.id}" type="button">
        <strong>${ship.name}</strong><span>${ship.rigLabel}</span><small>${ship.description}</small>
      </button>
    `).join('');
    shipsEl.querySelectorAll<HTMLButtonElement>('[data-ship]').forEach((button) => button.addEventListener('click', () => {
      selectedShip = shipPresetFromId(button.dataset.ship);
      render();
    }));

    summaryEl.innerHTML = `<strong>${selectedMission.title} · ${selectedShip.name}</strong><small>${selectedMission.from} → ${selectedMission.to} · ${selectedShip.rigLabel}</small>`;
  }

  overlay.querySelector<HTMLButtonElement>('#pre-start')!.addEventListener('click', () => {
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('mission', selectedMission.id);
    url.searchParams.set('ship', selectedShip.id);
    url.searchParams.set('play', '1');
    window.location.assign(url);
  });

  render();
}
