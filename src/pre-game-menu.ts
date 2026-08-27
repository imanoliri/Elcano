import { campaigns, missionFromUrl, type Campaign, type Mission } from './missions';
import { SHIP_PRESETS, shipPresetFromId, type ShipPreset } from './ship-selection';

const params = new URLSearchParams(window.location.search);
const isPlaying = params.get('play') === '1';

if (!isPlaying) {
  const activeMission = missionFromUrl();
  let selectedCampaign: Campaign = campaigns.find((campaign) => campaign.missions.some((mission) => mission.id === activeMission.id)) ?? campaigns[0];
  let selectedMission: Mission = activeMission;
  let selectedShip: ShipPreset = shipPresetFromId(params.get('ship'));
  let shipInfoShip: ShipPreset | null = null;
  let detailedPolar = false;

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
    <div id="ship-info-modal" class="ship-info-modal" aria-hidden="true">
      <div class="ship-info-backdrop"></div>
      <section class="ship-info-card" role="dialog" aria-modal="true" aria-labelledby="ship-info-title">
        <button class="ship-info-close" type="button" aria-label="Close ship information">×</button>
        <div id="ship-info-content"></div>
      </section>
    </div>
  `;
  document.body.appendChild(overlay);

  const style = document.createElement('style');
  style.textContent = `
    .pre-game-menu{position:fixed;inset:0;z-index:200;background:radial-gradient(circle at 50% 15%,#174b5f 0,#0b2d3d 38%,#06131b 100%);overflow:auto;color:#f4efe6}
    .pre-game-card{width:min(980px,calc(100% - 32px));margin:0 auto;padding:clamp(28px,6vw,64px) 0 48px}.pre-game-header{display:flex;justify-content:space-between;gap:32px;align-items:end;margin-bottom:32px}.pre-game-header h1{margin:4px 0 0;font:700 clamp(36px,7vw,68px)/.95 Georgia,serif}.pre-game-header>p{max-width:320px;margin:0;opacity:.68;line-height:1.5}.pre-game-kicker{margin:0;color:#d7bc7f;font:800 11px/1 system-ui;letter-spacing:.22em}
    .pre-game-section{margin:24px 0}.pre-game-section h2{margin:0 0 10px;font:700 12px/1 system-ui;text-transform:uppercase;letter-spacing:.14em;color:#d7bc7f}
    .pre-campaigns,.pre-ships{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px}.pre-missions{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:8px;max-height:310px;overflow:auto;padding-right:3px}
    .pre-choice{position:relative;border:1px solid rgba(255,255,255,.12);border-radius:14px;background:rgba(255,255,255,.035);color:#f4efe6;padding:14px;text-align:left;cursor:pointer}.pre-choice:hover{background:rgba(255,255,255,.065)}.pre-choice.active{border-color:rgba(232,185,79,.7);background:rgba(232,185,79,.1);box-shadow:inset 0 0 0 1px rgba(232,185,79,.12)}.pre-choice strong,.pre-choice span,.pre-choice small{display:block}.pre-choice strong{font-size:.92rem}.pre-choice span{margin-top:4px;color:#d7bc7f;font-size:.68rem}.pre-choice small{margin-top:6px;opacity:.58;line-height:1.35}
    .pre-ship-choice{padding-right:48px}.pre-ship-info{position:absolute;right:9px;top:9px;display:grid;place-items:center;width:30px;height:30px;border:1px solid rgba(255,255,255,.16);border-radius:50%;background:rgba(4,16,24,.42);color:#f4efe6;font:800 14px/1 Georgia,serif;cursor:pointer}.pre-ship-info:hover{background:rgba(232,185,79,.16);border-color:rgba(232,185,79,.45)}
    .pre-mission{display:grid;grid-template-columns:34px 1fr;gap:9px;align-items:start}.pre-mission-number{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.07);color:#d7bc7f;font-weight:800;font-size:.72rem}
    .pre-game-footer{position:sticky;bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:18px;margin-top:28px;padding:14px 16px;border:1px solid rgba(255,255,255,.12);border-radius:16px;background:rgba(4,16,24,.9);backdrop-filter:blur(16px);box-shadow:0 16px 50px rgba(0,0,0,.35)}.pre-summary{min-width:0}.pre-summary strong,.pre-summary small{display:block}.pre-summary small{margin-top:3px;opacity:.58}.pre-start{flex:0 0 auto;border:0;border-radius:12px;background:#e8b94f;color:#17202a;padding:13px 20px;font-weight:900}
    .ship-info-modal{position:fixed;inset:0;z-index:260;display:none;place-items:center;padding:18px}.ship-info-modal.open{display:grid}.ship-info-backdrop{position:absolute;inset:0;background:rgba(2,9,14,.8);backdrop-filter:blur(8px)}.ship-info-card{position:relative;width:min(720px,100%);max-height:calc(100dvh - 36px);overflow:auto;padding:26px;border:1px solid rgba(255,255,255,.14);border-radius:22px;background:linear-gradient(145deg,rgba(13,43,56,.99),rgba(5,19,28,.99));box-shadow:0 25px 80px rgba(0,0,0,.55)}.ship-info-close{position:absolute;right:14px;top:14px;width:38px;height:38px;border:0;border-radius:50%;background:rgba(255,255,255,.08);color:#f4efe6;font-size:1.5rem}.ship-info-header{padding-right:44px}.ship-info-header .pre-game-kicker{margin-bottom:6px}.ship-info-header h2{margin:0;font:700 clamp(28px,6vw,42px)/1 Georgia,serif}.ship-info-header p{margin:8px 0 0;opacity:.7;line-height:1.45}.ship-info-layout{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(220px,.8fr);gap:22px;margin-top:22px;align-items:start}.polar-panel{padding:14px;border:1px solid rgba(255,255,255,.1);border-radius:16px;background:rgba(255,255,255,.025)}.polar-panel svg{display:block;width:100%;height:auto}.polar-caption{margin:8px 0 0;text-align:center;font-size:.7rem;opacity:.56}.polar-mode-toggle{display:flex;justify-content:center;gap:6px;margin-bottom:8px}.polar-mode-toggle button{border:1px solid rgba(255,255,255,.13);border-radius:999px;background:rgba(255,255,255,.04);color:#f4efe6;padding:6px 11px;font-size:.67rem;font-weight:750}.polar-mode-toggle button.active{border-color:rgba(232,185,79,.6);background:rgba(232,185,79,.13);color:#f1d38d}.ship-stats{display:grid;grid-template-columns:1fr 1fr;gap:9px}.ship-stat{padding:11px;border-radius:12px;background:rgba(255,255,255,.05)}.ship-stat span,.ship-stat strong{display:block}.ship-stat span{font-size:.62rem;text-transform:uppercase;letter-spacing:.08em;opacity:.52}.ship-stat strong{margin-top:4px;font-size:.92rem}.polar-table{margin-top:14px;width:100%;border-collapse:collapse;font-size:.72rem}.polar-table th,.polar-table td{padding:6px 7px;border-bottom:1px solid rgba(255,255,255,.08);text-align:right}.polar-table th:first-child,.polar-table td:first-child{text-align:left}.polar-table th{opacity:.5;text-transform:uppercase;font-size:.58rem;letter-spacing:.08em}.ship-role{margin-top:14px;padding:12px 13px;border-left:3px solid #e8b94f;background:rgba(232,185,79,.07);font-size:.78rem;line-height:1.45}
    @media(max-width:650px){.pre-game-card{width:min(100% - 20px,980px);padding-top:26px}.pre-game-header{display:block}.pre-game-header>p{margin-top:12px}.pre-campaigns,.pre-ships{display:flex;overflow-x:auto}.pre-campaigns .pre-choice,.pre-ships .pre-choice{flex:0 0 180px}.pre-missions{grid-template-columns:1fr;max-height:280px}.pre-game-footer{bottom:8px}.pre-summary small{display:none}.ship-info-layout{grid-template-columns:1fr}.ship-info-card{padding:22px}.ship-stats{grid-template-columns:1fr 1fr}}
  `;
  document.head.appendChild(style);

  const campaignsEl = overlay.querySelector<HTMLElement>('#pre-campaigns')!;
  const missionsEl = overlay.querySelector<HTMLElement>('#pre-missions')!;
  const shipsEl = overlay.querySelector<HTMLElement>('#pre-ships')!;
  const summaryEl = overlay.querySelector<HTMLElement>('#pre-summary')!;
  const shipInfoModal = overlay.querySelector<HTMLElement>('#ship-info-modal')!;
  const shipInfoContent = overlay.querySelector<HTMLElement>('#ship-info-content')!;

  function noGoAngle(ship: ShipPreset) {
    const firstUseful = ship.rig.points.find((point) => point.efficiency > 0.001);
    return firstUseful?.angleDeg ?? 180;
  }

  function polarGeometry(ship: ShipPreset) {
    const cx = 160;
    const cy = 160;
    const radius = 116;
    const points = ship.rig.points;
    const mirrored = [
      ...points.slice().reverse().map((point) => ({ angleDeg: -point.angleDeg, efficiency: point.efficiency })),
      ...points.slice(1),
    ];
    const xy = (angleDeg: number, efficiency: number) => {
      const angle = angleDeg * Math.PI / 180;
      const r = radius * efficiency;
      return { x: cx + Math.sin(angle) * r, y: cy - Math.cos(angle) * r };
    };
    const path = mirrored.map((point, index) => {
      const p = xy(point.angleDeg, point.efficiency);
      return `${index === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    }).join(' ') + ' Z';
    return { cx, cy, radius, points, xy, path };
  }

  function simplePolarSvg(ship: ShipPreset) {
    const { cx, cy, radius, xy, path } = polarGeometry(ship);
    const rings = [0.25, 0.5, 0.75, 1].map((fraction) => `<circle cx="${cx}" cy="${cy}" r="${radius * fraction}" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="1"/>`).join('');
    const spokes = [0, 45, 90, 135, 180, 225, 270, 315].map((angleDeg) => {
      const p = xy(angleDeg, 1);
      return `<line x1="${cx}" y1="${cy}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="rgba(255,255,255,.09)" stroke-width="1"/>`;
    }).join('');
    const noGo = noGoAngle(ship);
    const left = xy(-noGo, 1);
    const right = xy(noGo, 1);
    return `<svg viewBox="0 0 320 325" role="img" aria-label="Simple polar performance diagram for ${ship.name}">
      ${rings}${spokes}
      <path d="M ${cx} ${cy} L ${left.x.toFixed(1)} ${left.y.toFixed(1)} A ${radius} ${radius} 0 0 1 ${right.x.toFixed(1)} ${right.y.toFixed(1)} Z" fill="rgba(220,90,76,.12)"/>
      <path d="${path}" fill="rgba(232,185,79,.18)" stroke="#e8b94f" stroke-width="2.5" stroke-linejoin="round"/>
      <text x="${cx}" y="18" text-anchor="middle" fill="rgba(244,239,230,.62)" font-size="9" font-family="system-ui">0° · into wind</text>
      <text x="292" y="164" text-anchor="end" fill="rgba(244,239,230,.55)" font-size="9" font-family="system-ui">90°</text>
      <text x="${cx}" y="318" text-anchor="middle" fill="rgba(244,239,230,.62)" font-size="9" font-family="system-ui">180° · running</text>
      <text x="28" y="164" fill="rgba(244,239,230,.55)" font-size="9" font-family="system-ui">90°</text>
      <circle cx="${cx}" cy="${cy}" r="3.5" fill="#f4efe6"/>
    </svg>`;
  }

  function detailedPolarSvg(ship: ShipPreset) {
    const { cx, cy, radius, points, xy, path } = polarGeometry(ship);
    const rings = [0.5, 1].map((fraction) => {
      const y = cy - radius * fraction + 10;
      return `<circle cx="${cx}" cy="${cy}" r="${radius * fraction}" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="1"/><text x="${cx + 5}" y="${y.toFixed(1)}" fill="rgba(244,239,230,.46)" font-size="8" font-family="system-ui">${Math.round(fraction * 100)}%</text>`;
    }).join('');
    const sectorAngles = [0, 30, 45, 60, 90, 120, 150, 180, 210, 240, 270, 300, 315, 330];
    const spokes = sectorAngles.map((angleDeg) => {
      const p = xy(angleDeg, 1);
      return `<line x1="${cx}" y1="${cy}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="rgba(255,255,255,.09)" stroke-width="1"/>`;
    }).join('');
    const angleLabels = [30, 45, 60, 90, 120, 150, 180].map((angleDeg) => {
      const p = xy(angleDeg, 1.11);
      return `<text x="${p.x.toFixed(1)}" y="${(p.y + 3).toFixed(1)}" text-anchor="middle" fill="rgba(244,239,230,.54)" font-size="8" font-family="system-ui">${angleDeg}°</text>`;
    }).join('');
    const noGo = noGoAngle(ship);
    const left = xy(-noGo, 1);
    const right = xy(noGo, 1);
    const noGoLabel = xy(noGo, 1.08);
    const deadZone = `<path d="M ${cx} ${cy} L ${left.x.toFixed(1)} ${left.y.toFixed(1)} A ${radius} ${radius} 0 0 1 ${right.x.toFixed(1)} ${right.y.toFixed(1)} Z" fill="rgba(220,90,76,.12)"/><line x1="${cx}" y1="${cy}" x2="${left.x.toFixed(1)}" y2="${left.y.toFixed(1)}" stroke="rgba(230,120,105,.7)" stroke-width="1.4" stroke-dasharray="4 3"/><line x1="${cx}" y1="${cy}" x2="${right.x.toFixed(1)}" y2="${right.y.toFixed(1)}" stroke="rgba(230,120,105,.7)" stroke-width="1.4" stroke-dasharray="4 3"/><text x="${noGoLabel.x.toFixed(1)}" y="${noGoLabel.y.toFixed(1)}" text-anchor="middle" fill="rgba(245,170,155,.9)" font-size="8" font-family="system-ui">${noGo}° dead</text>`;
    const efficiencyLabels = points.filter((point) => point.angleDeg >= noGo && point.angleDeg > 0).map((point) => {
      const p = xy(point.angleDeg, Math.max(point.efficiency, 0.13));
      return `<text x="${(p.x + 7).toFixed(1)}" y="${(p.y + 3).toFixed(1)}" fill="rgba(255,226,160,.93)" font-size="8" font-weight="700" font-family="system-ui">${Math.round(point.efficiency * 100)}%</text>`;
    }).join('');
    return `<svg viewBox="0 0 320 325" role="img" aria-label="Detailed polar performance diagram for ${ship.name}">
      ${rings}${spokes}${deadZone}
      <path d="${path}" fill="rgba(232,185,79,.18)" stroke="#e8b94f" stroke-width="2.5" stroke-linejoin="round"/>
      ${angleLabels}${efficiencyLabels}
      <text x="${cx}" y="18" text-anchor="middle" fill="rgba(244,239,230,.68)" font-size="9" font-family="system-ui">Into wind</text>
      <circle cx="${cx}" cy="${cy}" r="3.5" fill="#f4efe6"/>
    </svg>`;
  }

  function renderShipInfo() {
    if (!shipInfoShip) return;
    const ship = shipInfoShip;
    const rows = ship.rig.points.map((point) => `<tr><td>${point.angleDeg}°</td><td>${Math.round(point.efficiency * 100)}%</td></tr>`).join('');
    const peakAngles = ship.rig.points.filter((point) => point.efficiency >= 0.98).map((point) => `${point.angleDeg}°`).join('–') || '—';
    shipInfoContent.innerHTML = `
      <header class="ship-info-header">
        <p class="pre-game-kicker">SHIP & RIG</p>
        <h2 id="ship-info-title">${ship.name}</h2>
        <p>${ship.description}</p>
      </header>
      <div class="ship-info-layout">
        <div class="polar-panel">
          <div class="polar-mode-toggle" role="group" aria-label="Diagram detail">
            <button type="button" data-polar-mode="simple" class="${detailedPolar ? '' : 'active'}" aria-pressed="${!detailedPolar}">Simple</button>
            <button type="button" data-polar-mode="detailed" class="${detailedPolar ? 'active' : ''}" aria-pressed="${detailedPolar}">Detailed</button>
          </div>
          ${detailedPolar ? detailedPolarSvg(ship) : simplePolarSvg(ship)}
          <p class="polar-caption">${detailedPolar ? 'Detailed: key wind angles, no-go boundary and efficiency labels.' : 'Simple: shape of the rig polar and the main wind directions.'}</p>
        </div>
        <div>
          <div class="ship-stats">
            <div class="ship-stat"><span>Rig</span><strong>${ship.rigLabel}</strong></div>
            <div class="ship-stat"><span>Speed cap</span><strong>${ship.vessel.maxThroughWaterSpeedKn.toFixed(1)} kn</strong></div>
            <div class="ship-stat"><span>No-go zone</span><strong>&lt; ${noGoAngle(ship)}°</strong></div>
            <div class="ship-stat"><span>Peak angles</span><strong>${peakAngles}</strong></div>
          </div>
          <div class="ship-role"><strong>Character:</strong> ${ship.description}</div>
          <table class="polar-table">
            <thead><tr><th>Wind angle</th><th>Efficiency</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;
    shipInfoContent.querySelectorAll<HTMLButtonElement>('[data-polar-mode]').forEach((button) => button.addEventListener('click', () => {
      detailedPolar = button.dataset.polarMode === 'detailed';
      renderShipInfo();
    }));
  }

  function openShipInfo(ship: ShipPreset) {
    shipInfoShip = ship;
    detailedPolar = false;
    renderShipInfo();
    shipInfoModal.classList.add('open');
    shipInfoModal.setAttribute('aria-hidden', 'false');
  }

  function closeShipInfo() {
    shipInfoModal.classList.remove('open');
    shipInfoModal.setAttribute('aria-hidden', 'true');
    shipInfoShip = null;
    detailedPolar = false;
  }

  shipInfoModal.querySelector('.ship-info-close')?.addEventListener('click', closeShipInfo);
  shipInfoModal.querySelector('.ship-info-backdrop')?.addEventListener('click', closeShipInfo);
  window.addEventListener('keydown', (event) => { if (event.key === 'Escape' && shipInfoModal.classList.contains('open')) closeShipInfo(); });

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
      <div class="pre-choice pre-ship-choice ${ship.id === selectedShip.id ? 'active' : ''}" data-ship-card="${ship.id}">
        <button class="pre-ship-info" data-ship-info="${ship.id}" type="button" aria-label="Information about ${ship.name}" title="Ship performance">i</button>
        <button class="pre-ship-select" data-ship="${ship.id}" type="button" style="all:unset;display:block;cursor:pointer;width:100%">
          <strong>${ship.name}</strong><span>${ship.rigLabel}</span><small>${ship.description}</small>
        </button>
      </div>
    `).join('');
    shipsEl.querySelectorAll<HTMLButtonElement>('[data-ship]').forEach((button) => button.addEventListener('click', () => {
      selectedShip = shipPresetFromId(button.dataset.ship);
      render();
    }));
    shipsEl.querySelectorAll<HTMLButtonElement>('[data-ship-info]').forEach((button) => button.addEventListener('click', (event) => {
      event.stopPropagation();
      openShipInfo(shipPresetFromId(button.dataset.shipInfo));
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
