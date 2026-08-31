import { campaigns, missionFromUrl, type Campaign, type Mission } from './missions';
import { SHIP_PRESETS, shipPresetFromId, type ShipPreset } from './ship-selection';
import { bestTimeForMission, exportExpeditionProgress, getExpeditionProgress, importExpeditionProgress, resetExpeditionProgress, voyageForMission } from './expedition-progress';
import { createKeyboardControlsPanel } from './keyboard-controls';
import { CARGO_LABELS, cargoTotal, crewTotal, dailyWages, enduranceDays, loadoutFromParams, profileForShip, type CargoKind, type ProvisioningLoadout } from './provisioning';

const params = new URLSearchParams(window.location.search);
const isPlaying = params.get('play') === '1';

if (!isPlaying) {
  const activeMission = missionFromUrl();
  let selectedCampaign: Campaign = campaigns.find((campaign) => campaign.missions.some((mission) => mission.id === activeMission.id)) ?? campaigns[0];
  let selectedMission: Mission = activeMission;
  let selectedShip: ShipPreset = shipPresetFromId(params.get('ship'));
  let loadout: ProvisioningLoadout = loadoutFromParams(params, selectedShip.id);
  let shipInfoShip: ShipPreset | null = null;
  let detailedPolar = false;

  const overlay = document.createElement('div');
  overlay.className = 'pre-game-menu';
  overlay.innerHTML = `
    <main class="pre-game-card">
      <header class="pre-game-header">
        <div><p class="pre-game-kicker">ELCANO</p><h1>Choose your voyage</h1></div>
        <div><p>Pick a mission and ship before taking the helm.</p><button id="open-logbook" class="pre-logbook-button" type="button">Voyage logbook</button></div>
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
      <section class="pre-game-section">
        <h2>Provisioning & crew</h2>
        <div id="pre-provisioning" class="pre-provisioning"></div>
      </section>
      <section class="pre-game-section"><h2>Controls</h2><div id="pre-keyboard-controls"></div></section>
      <footer class="pre-game-footer">
        <div id="pre-summary" class="pre-summary"></div>
        <button id="pre-start" class="pre-start" type="button">Start voyage</button>
      </footer>
    </main>
    <div id="ship-info-modal" class="ship-info-modal" aria-hidden="true">
      <div class="ship-info-backdrop"></div>
      <button class="ship-info-nav ship-info-prev" type="button" aria-label="Previous ship">←</button>
      <section class="ship-info-card" role="dialog" aria-modal="true" aria-labelledby="ship-info-title">
        <button class="ship-info-close" type="button" aria-label="Close ship information">×</button>
        <div id="ship-info-content"></div>
      </section>
      <button class="ship-info-nav ship-info-next" type="button" aria-label="Next ship">→</button>
    </div>
    <div id="logbook-modal" class="ship-info-modal" aria-hidden="true"><div class="ship-info-backdrop"></div><section class="ship-info-card logbook-card" role="dialog" aria-modal="true" aria-labelledby="logbook-title"><button class="logbook-close ship-info-close" type="button" aria-label="Close logbook">×</button><div id="logbook-content"></div></section></div>
  `;
  document.body.appendChild(overlay);

  const style = document.createElement('style');
  style.textContent = `
    .pre-game-menu{position:fixed;inset:0;z-index:200;background:radial-gradient(circle at 50% 15%,#174b5f 0,#0b2d3d 38%,#06131b 100%);overflow:auto;color:#f4efe6}.pre-logbook-button{margin-top:10px;border:1px solid rgba(232,185,79,.45);border-radius:999px;background:rgba(232,185,79,.1);color:#f1d38d;padding:8px 12px;font-weight:800;cursor:pointer}.logbook-list{display:grid;gap:9px;margin-top:18px}.logbook-entry{padding:11px;border-radius:12px;background:rgba(255,255,255,.05)}.logbook-entry strong,.logbook-entry small{display:block}.logbook-entry small{margin-top:4px;opacity:.68;line-height:1.4}.logbook-transfer{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:20px}.logbook-transfer button{padding:12px;border:1px solid rgba(232,185,79,.4);border-radius:11px;background:rgba(232,185,79,.1);color:#f1d38d;font-weight:800;cursor:pointer}.logbook-reset{margin-top:10px;width:100%;padding:12px;border:1px solid rgba(229,119,102,.5);border-radius:11px;background:rgba(151,51,40,.16);color:#ffd0c8;font-weight:800;cursor:pointer}
    .pre-game-card{width:min(980px,calc(100% - 32px));margin:0 auto;padding:clamp(28px,6vw,64px) 0 48px}.pre-game-header{display:flex;justify-content:space-between;gap:32px;align-items:end;margin-bottom:32px}.pre-game-header h1{margin:4px 0 0;font:700 clamp(36px,7vw,68px)/.95 Georgia,serif}.pre-game-header>p{max-width:320px;margin:0;opacity:.68;line-height:1.5}.pre-game-kicker{margin:0;color:#d7bc7f;font:800 11px/1 system-ui;letter-spacing:.22em}
    .pre-game-section{margin:24px 0}.pre-game-section h2{margin:0 0 10px;font:700 12px/1 system-ui;text-transform:uppercase;letter-spacing:.14em;color:#d7bc7f}
    .keyboard-controls{border:1px solid rgba(255,255,255,.12);border-radius:14px;background:rgba(255,255,255,.035)}.keyboard-controls summary{padding:14px;cursor:pointer;font-weight:800;color:#f1d38d}.keyboard-controls summary span{float:right;font-size:.7rem;letter-spacing:.08em;text-transform:uppercase;opacity:.72}.keyboard-controls>p{margin:0;padding:0 14px 13px;opacity:.64;font-size:.78rem;line-height:1.45}.keyboard-controls-list{display:grid;gap:1px;border-top:1px solid rgba(255,255,255,.09)}.keyboard-control-row{display:grid;grid-template-columns:minmax(130px,1fr) minmax(150px,auto);align-items:center;gap:12px;padding:10px 14px;background:rgba(0,0,0,.06)}.keyboard-control-row strong,.keyboard-control-row small{display:block}.keyboard-control-row strong{font-size:.78rem}.keyboard-control-row small{margin-top:2px;font-size:.67rem;opacity:.55}.keyboard-binding-list{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:5px}.keyboard-binding,.keyboard-add-binding,.keyboard-controls-reset{border:1px solid rgba(232,185,79,.35);border-radius:7px;background:rgba(232,185,79,.1);color:#f4efe6;font-weight:800;font-size:.7rem}.keyboard-binding{min-width:34px;padding:5px 7px}.keyboard-add-binding{padding:5px 7px;opacity:.78}.keyboard-binding.is-capturing{min-width:96px}.keyboard-controls-reset{margin:12px 14px;padding:7px 10px}.keyboard-controls-reset:hover,.keyboard-binding:hover,.keyboard-add-binding:hover{background:rgba(232,185,79,.2)}
    .pre-campaigns,.pre-ships{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px}.pre-missions{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:8px;max-height:310px;overflow:auto;padding-right:3px}
    .pre-choice{position:relative;border:1px solid rgba(255,255,255,.12);border-radius:14px;background:rgba(255,255,255,.035);color:#f4efe6;padding:14px;text-align:left;cursor:pointer}.pre-choice:hover{background:rgba(255,255,255,.065)}.pre-choice.active{border-color:rgba(232,185,79,.7);background:rgba(232,185,79,.1);box-shadow:inset 0 0 0 1px rgba(232,185,79,.12)}.pre-choice strong,.pre-choice span,.pre-choice small{display:block}.pre-choice strong{font-size:.92rem}.pre-choice span{margin-top:4px;color:#d7bc7f;font-size:.68rem}.pre-choice small{margin-top:6px;opacity:.58;line-height:1.35}
    .pre-provisioning{padding:16px;border:1px solid rgba(255,255,255,.12);border-radius:14px;background:rgba(255,255,255,.035)}.provisioning-header{display:flex;justify-content:space-between;gap:12px;align-items:start}.provisioning-header strong,.provisioning-header small{display:block}.provisioning-header small{margin-top:4px;opacity:.6;line-height:1.4}.provisioning-meters{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0}.provisioning-meter{padding:9px;border-radius:10px;background:rgba(0,0,0,.16)}.provisioning-meter span,.provisioning-meter strong{display:block}.provisioning-meter span{font-size:.62rem;text-transform:uppercase;letter-spacing:.08em;opacity:.55}.provisioning-meter strong{margin-top:4px;font-size:.86rem}.provisioning-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.provisioning-control{padding:10px;border:1px solid rgba(255,255,255,.08);border-radius:10px;background:rgba(0,0,0,.1)}.provisioning-control label{display:flex;justify-content:space-between;gap:8px;font-size:.78rem;font-weight:800}.provisioning-control input{width:100%;margin:8px 0 2px;accent-color:#e8b94f}.provisioning-control small{display:block;opacity:.55;font-size:.65rem}.provisioning-warning{margin:12px 0 0;color:#ffd19a;font-size:.74rem;line-height:1.35}.provisioning-warning.invalid{color:#ffad9e}
    .pre-ship-choice{padding-right:48px}.pre-ship-info{position:absolute;right:9px;top:9px;display:grid;place-items:center;width:30px;height:30px;border:1px solid rgba(255,255,255,.16);border-radius:50%;background:rgba(4,16,24,.42);color:#f4efe6;font:800 14px/1 Georgia,serif;cursor:pointer}.pre-ship-info:hover{background:rgba(232,185,79,.16);border-color:rgba(232,185,79,.45)}
    .pre-mission{display:grid;grid-template-columns:34px 1fr;gap:9px;align-items:start}.pre-mission-number{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.07);color:#d7bc7f;font-weight:800;font-size:.72rem}
    .pre-game-footer{position:sticky;bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:18px;margin-top:28px;padding:14px 16px;border:1px solid rgba(255,255,255,.12);border-radius:16px;background:rgba(4,16,24,.9);backdrop-filter:blur(16px);box-shadow:0 16px 50px rgba(0,0,0,.35)}.pre-summary{min-width:0}.pre-summary strong,.pre-summary small{display:block}.pre-summary small{margin-top:3px;opacity:.58}.pre-start{flex:0 0 auto;border:0;border-radius:12px;background:#e8b94f;color:#17202a;padding:13px 20px;font-weight:900}
    .ship-info-modal{position:fixed;inset:0;z-index:260;display:none;place-items:center;padding:18px}.ship-info-modal.open{display:grid}.ship-info-backdrop{position:absolute;inset:0;background:rgba(2,9,14,.8);backdrop-filter:blur(8px)}.ship-info-card{position:relative;width:min(720px,100%);max-height:calc(100dvh - 36px);overflow:auto;padding:26px;border:1px solid rgba(255,255,255,.14);border-radius:22px;background:linear-gradient(145deg,rgba(13,43,56,.99),rgba(5,19,28,.99));box-shadow:0 25px 80px rgba(0,0,0,.55)}.ship-info-close{position:absolute;right:14px;top:14px;width:38px;height:38px;border:0;border-radius:50%;background:rgba(255,255,255,.08);color:#f4efe6;font-size:1.5rem}.ship-info-nav{position:absolute;z-index:3;top:50%;transform:translateY(-50%);display:grid;place-items:center;width:44px;height:56px;border:1px solid rgba(255,255,255,.16);border-radius:14px;background:rgba(4,16,24,.82);color:#f4efe6;font-size:1.35rem;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.28)}.ship-info-nav:hover{background:rgba(232,185,79,.16);border-color:rgba(232,185,79,.45)}.ship-info-prev{left:max(10px,calc(50% - 420px))}.ship-info-next{right:max(10px,calc(50% - 420px))}.ship-info-header{padding-right:44px}.ship-info-header .pre-game-kicker{margin-bottom:6px}.ship-info-header h2{margin:0;font:700 clamp(28px,6vw,42px)/1 Georgia,serif}.ship-info-header p{margin:8px 0 0;opacity:.7;line-height:1.45}.ship-info-layout{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(220px,.8fr);gap:22px;margin-top:22px;align-items:start}.polar-panel{position:relative;padding:14px;border:1px solid rgba(255,255,255,.1);border-radius:16px;background:rgba(255,255,255,.025)}.polar-panel svg{display:block;width:100%;height:auto}.polar-mode-toggle{position:absolute;z-index:2;top:10px;right:10px;width:116px;height:28px;padding:2px;border:1px solid rgba(255,255,255,.14);border-radius:999px;background:rgba(4,16,24,.78);color:#f4efe6;display:grid;grid-template-columns:1fr 1fr;align-items:center;cursor:pointer;font-size:.62rem;font-weight:800;isolation:isolate}.polar-mode-toggle::before{content:'';position:absolute;z-index:-1;top:2px;left:2px;width:calc(50% - 2px);height:22px;border-radius:999px;background:rgba(232,185,79,.2);border:1px solid rgba(232,185,79,.5);transition:transform .16s ease}.polar-mode-toggle.detailed::before{transform:translateX(100%)}.polar-mode-toggle span{position:relative;text-align:center;opacity:.55}.polar-mode-toggle:not(.detailed) span:first-child,.polar-mode-toggle.detailed span:last-child{opacity:1;color:#f1d38d}.ship-stats{display:grid;grid-template-columns:1fr 1fr;gap:9px}.ship-stat{padding:11px;border-radius:12px;background:rgba(255,255,255,.05)}.ship-stat span,.ship-stat strong{display:block}.ship-stat span{font-size:.62rem;text-transform:uppercase;letter-spacing:.08em;opacity:.52}.ship-stat strong{margin-top:4px;font-size:.92rem}.polar-table{margin-top:14px;width:100%;border-collapse:collapse;font-size:.72rem}.polar-table th,.polar-table td{padding:6px 7px;border-bottom:1px solid rgba(255,255,255,.08);text-align:right}.polar-table th:first-child,.polar-table td:first-child{text-align:left}.polar-table th{opacity:.5;text-transform:uppercase;font-size:.58rem;letter-spacing:.08em}
    @media(max-width:650px){.pre-game-card{width:min(100% - 20px,980px);padding-top:26px}.pre-game-header{display:block}.pre-game-header>p{margin-top:12px}.pre-campaigns,.pre-ships{display:flex;overflow-x:auto}.pre-campaigns .pre-choice,.pre-ships .pre-choice{flex:0 0 180px}.pre-missions{grid-template-columns:1fr;max-height:280px}.pre-game-footer{bottom:8px}.pre-summary small{display:none}.ship-info-layout{grid-template-columns:1fr}.ship-info-card{padding:22px}.ship-info-nav{width:38px;height:48px}.ship-info-prev{left:5px}.ship-info-next{right:5px}.ship-stats{grid-template-columns:1fr 1fr}.provisioning-grid{grid-template-columns:1fr}.provisioning-meters{grid-template-columns:1fr 1fr}}
    @media(max-width:500px){.keyboard-control-row{grid-template-columns:1fr}.keyboard-binding-list{justify-content:flex-start}}
  `;
  document.head.appendChild(style);

  const campaignsEl = overlay.querySelector<HTMLElement>('#pre-campaigns')!;
  const missionsEl = overlay.querySelector<HTMLElement>('#pre-missions')!;
  const shipsEl = overlay.querySelector<HTMLElement>('#pre-ships')!;
  const summaryEl = overlay.querySelector<HTMLElement>('#pre-summary')!;
  const provisioningEl = overlay.querySelector<HTMLElement>('#pre-provisioning')!;
  const shipInfoModal = overlay.querySelector<HTMLElement>('#ship-info-modal')!;
  const shipInfoContent = overlay.querySelector<HTMLElement>('#ship-info-content')!;
  const logbookModal = overlay.querySelector<HTMLElement>('#logbook-modal')!;
  const logbookContent = overlay.querySelector<HTMLElement>('#logbook-content')!;
  overlay.querySelector('#pre-keyboard-controls')!.append(createKeyboardControlsPanel());

  const formatHours = (hours: number) => `${(hours / 24).toFixed(1)} d`;
  function renderLogbook() {
    const progress = getExpeditionProgress();
    logbookContent.innerHTML = `<header class="ship-info-header"><p class="pre-game-kicker">EXPEDITION RECORD</p><h2 id="logbook-title">Voyage logbook</h2><p>Completed legs and your accumulated chart knowledge. Replays update one mission record: latest result plus best time.</p></header>${campaigns.map((campaign) => {
      const done = campaign.missions.filter((mission) => voyageForMission(mission.id));
      return `<section class="logbook-list"><strong>${campaign.title} · ${done.length} / ${campaign.missions.length} completed</strong>${done.length ? done.map((mission) => { const v = voyageForMission(mission.id)!; return `<div class="logbook-entry"><strong>✓ ${mission.number}. ${mission.title}</strong><small>Best ${formatHours(bestTimeForMission(mission.id)!)} · latest ${formatHours(v.elapsedHours)} · ${Math.round(v.distanceNm)} nm · ${shipPresetFromId(v.shipId).name}</small></div>`; }).join('') : '<small>No completed legs yet.</small>'}</section>`;
    }).join('')}<div class="logbook-transfer"><button id="export-expedition" type="button">Export JSON</button><button id="import-expedition" type="button">Import JSON</button><input id="import-expedition-file" type="file" accept="application/json,.json" hidden></div><button id="reset-expedition" class="logbook-reset" type="button">Reset expedition progress and chart</button>`;
    logbookContent.querySelector('#export-expedition')?.addEventListener('click', () => {
      const blob = new Blob([exportExpeditionProgress()], { type: 'application/json' });
      const url = URL.createObjectURL(blob); const link = document.createElement('a');
      const now = new Date();
      const part = (value: number) => String(value).padStart(2, '0');
      const timestamp = `${now.getFullYear()}_${part(now.getMonth() + 1)}_${part(now.getDate())}_${part(now.getHours())}_${part(now.getMinutes())}_${part(now.getSeconds())}`;
      link.href = url; link.download = `elcano_game__${timestamp}.json`; document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    const importInput = logbookContent.querySelector<HTMLInputElement>('#import-expedition-file')!;
    logbookContent.querySelector('#import-expedition')?.addEventListener('click', () => importInput.click());
    importInput.addEventListener('change', async () => {
      const file = importInput.files?.[0]; if (!file) return;
      if (!importExpeditionProgress(await file.text())) { window.alert('That file is not a valid Elcano expedition export.'); return; }
      renderLogbook(); render(); window.alert('Expedition progress and chart knowledge imported.');
    });
    logbookContent.querySelector('#reset-expedition')?.addEventListener('click', () => {
      if (!window.confirm('Reset expedition progress? This removes completed-mission records, best results, voyage history, and every explored chart tile.')) return;
      resetExpeditionProgress(); renderLogbook(); render();
    });
  }
  const openLogbook = () => { renderLogbook(); logbookModal.classList.add('open'); logbookModal.setAttribute('aria-hidden', 'false'); };
  const closeLogbook = () => { logbookModal.classList.remove('open'); logbookModal.setAttribute('aria-hidden', 'true'); };
  overlay.querySelector('#open-logbook')?.addEventListener('click', openLogbook);
  logbookModal.querySelector('.logbook-close')?.addEventListener('click', closeLogbook);
  logbookModal.querySelector('.ship-info-backdrop')?.addEventListener('click', closeLogbook);

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
      const label = fraction < 1 ? `<text x="${cx + 5}" y="${y.toFixed(1)}" fill="rgba(244,239,230,.46)" font-size="8" font-family="system-ui">${Math.round(fraction * 100)}%</text>` : '';
      return `<circle cx="${cx}" cy="${cy}" r="${radius * fraction}" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="1"/>${label}`;
    }).join('');
    const sectorAngles = [0, 30, 45, 60, 90, 120, 150, 180, 210, 240, 270, 300, 315, 330];
    const spokes = sectorAngles.map((angleDeg) => {
      const p = xy(angleDeg, 1);
      return `<line x1="${cx}" y1="${cy}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="rgba(255,255,255,.09)" stroke-width="1"/>`;
    }).join('');
    const angleLabels = [30, 45, 60, 90, 120, 150, 180].map((angleDeg) => {
      const p = xy(-angleDeg, 1.11);
      return `<text x="${(p.x - 4).toFixed(1)}" y="${(p.y + 3).toFixed(1)}" text-anchor="end" fill="rgba(244,239,230,.54)" font-size="8" font-family="system-ui">${angleDeg}°</text>`;
    }).join('');
    const noGo = noGoAngle(ship);
    const left = xy(-noGo, 1);
    const right = xy(noGo, 1);
    const noGoLabel = xy(-noGo, 1.08);
    const deadZone = `<path d="M ${cx} ${cy} L ${left.x.toFixed(1)} ${left.y.toFixed(1)} A ${radius} ${radius} 0 0 1 ${right.x.toFixed(1)} ${right.y.toFixed(1)} Z" fill="rgba(220,90,76,.12)"/><line x1="${cx}" y1="${cy}" x2="${left.x.toFixed(1)}" y2="${left.y.toFixed(1)}" stroke="rgba(230,120,105,.7)" stroke-width="1.4" stroke-dasharray="4 3"/><line x1="${cx}" y1="${cy}" x2="${right.x.toFixed(1)}" y2="${right.y.toFixed(1)}" stroke="rgba(230,120,105,.7)" stroke-width="1.4" stroke-dasharray="4 3"/><text x="${noGoLabel.x.toFixed(1)}" y="${noGoLabel.y.toFixed(1)}" text-anchor="middle" fill="rgba(245,170,155,.9)" font-size="8" font-family="system-ui">${noGo}° dead</text>`;
    const efficiencyLabels = points.filter((point) => point.angleDeg >= noGo && point.angleDeg > 0 && Math.round(point.efficiency * 100) < 100).map((point) => {
      const p = xy(-point.angleDeg, Math.max(point.efficiency, 0.13));
      return `<text x="${(p.x - 7).toFixed(1)}" y="${(p.y + 3).toFixed(1)}" text-anchor="end" fill="rgba(255,226,160,.93)" font-size="8" font-weight="700" font-family="system-ui">${Math.round(point.efficiency * 100)}%</text>`;
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
          <button type="button" class="polar-mode-toggle ${detailedPolar ? 'detailed' : ''}" data-polar-toggle aria-label="Toggle diagram detail" aria-pressed="${detailedPolar}">
            <span>Simple</span><span>Detailed</span>
          </button>
          ${detailedPolar ? detailedPolarSvg(ship) : simplePolarSvg(ship)}
        </div>
        <div>
          <div class="ship-stats">
            <div class="ship-stat"><span>Rig</span><strong>${ship.rigLabel}</strong></div>
            <div class="ship-stat"><span>Speed cap</span><strong>${ship.vessel.maxThroughWaterSpeedKn.toFixed(1)} kn</strong></div>
            <div class="ship-stat"><span>No-go zone</span><strong>&lt; ${noGoAngle(ship)}°</strong></div>
            <div class="ship-stat"><span>Peak angles</span><strong>${peakAngles}</strong></div>
          </div>
          <table class="polar-table">
            <thead><tr><th>Wind angle</th><th>Efficiency</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;
    shipInfoContent.querySelector<HTMLButtonElement>('[data-polar-toggle]')?.addEventListener('click', () => {
      detailedPolar = !detailedPolar;
      renderShipInfo();
    });
  }

  function switchShipInfo(offset: number) {
    if (!shipInfoShip) return;
    const currentIndex = SHIP_PRESETS.findIndex((ship) => ship.id === shipInfoShip?.id);
    const nextIndex = (currentIndex + offset + SHIP_PRESETS.length) % SHIP_PRESETS.length;
    const nextShip = SHIP_PRESETS[nextIndex];
    shipInfoShip = nextShip;
    selectedShip = nextShip;
    render();
    renderShipInfo();
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
  shipInfoModal.querySelector<HTMLButtonElement>('.ship-info-prev')?.addEventListener('click', () => switchShipInfo(-1));
  shipInfoModal.querySelector<HTMLButtonElement>('.ship-info-next')?.addEventListener('click', () => switchShipInfo(1));
  window.addEventListener('keydown', (event) => {
    if (!shipInfoModal.classList.contains('open')) return;
    if (event.key === 'Escape') closeShipInfo();
    if (event.key === 'ArrowLeft') switchShipInfo(-1);
    if (event.key === 'ArrowRight') switchShipInfo(1);
  });

  function render() {
    campaignsEl.innerHTML = campaigns.map((campaign) => `
      <button class="pre-choice ${campaign.id === selectedCampaign.id ? 'active' : ''}" data-campaign="${campaign.id}" type="button">
        <strong>${campaign.title}</strong><span>${campaign.subtitle} · ${campaign.missions.filter((mission) => voyageForMission(mission.id)).length} / ${campaign.missions.length} completed</span><small>${campaign.description}</small>
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
        <span class="pre-mission-number">${voyageForMission(mission.id) ? '✓' : mission.number}</span><span><strong>${mission.title}</strong><span>${mission.from} → ${mission.to}</span><small>${voyageForMission(mission.id) ? `Completed · best ${formatHours(bestTimeForMission(mission.id)!)} · ` : ''}${mission.date}</small></span>
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
      loadout = { ...profileForShip(selectedShip.id).defaultLoadout };
      render();
    }));
    shipsEl.querySelectorAll<HTMLButtonElement>('[data-ship-info]').forEach((button) => button.addEventListener('click', (event) => {
      event.stopPropagation();
      openShipInfo(shipPresetFromId(button.dataset.shipInfo));
    }));

    renderProvisioning();
    summaryEl.innerHTML = `<strong>${selectedMission.title} · ${selectedShip.name}</strong><small>${selectedMission.from} → ${selectedMission.to} · ${enduranceDays(loadout)} days of water/provisions · ${crewTotal(loadout)} crew</small>`;
  }

  function renderProvisioning() {
    const profile = profileForShip(selectedShip.id);
    const used = cargoTotal(loadout);
    const people = crewTotal(loadout);
    const valid = used <= profile.holdCapacityTons && people > 0 && people <= profile.crewCapacity;
    const cargoControls = (Object.keys(CARGO_LABELS) as CargoKind[]).map((kind) => `<div class="provisioning-control"><label for="loadout-${kind}"><span>${CARGO_LABELS[kind]}</span><strong>${loadout[kind].toFixed(kind === 'gold' ? 1 : 0)} t</strong></label><input id="loadout-${kind}" data-cargo="${kind}" type="range" min="0" max="${profile.holdCapacityTons}" step="${kind === 'gold' ? '.5' : '1'}" value="${loadout[kind]}"><small>Occupies hold capacity</small></div>`).join('');
    const crewControls = (['sailors', 'soldiers'] as const).map((kind) => `<div class="provisioning-control"><label for="loadout-${kind}"><span>${kind === 'sailors' ? 'Sailors' : 'Soldiers'}</span><strong>${loadout[kind]}</strong></label><input id="loadout-${kind}" data-crew="${kind}" type="range" min="0" max="${profile.crewCapacity}" step="1" value="${loadout[kind]}"><small>${kind === 'sailors' ? '40 maravedís/day' : '50 maravedís/day'}</small></div>`).join('');
    provisioningEl.innerHTML = `<div class="provisioning-header"><div><strong>${profile.historicalReference}</strong><small>${profile.sourceNote}</small></div><small>Historical capacity, game loadout</small></div><div class="provisioning-meters"><div class="provisioning-meter"><span>Hold</span><strong>${used.toFixed(1)} / ${profile.holdCapacityTons} tons burden</strong></div><div class="provisioning-meter"><span>Crew</span><strong>${people} / ${profile.crewCapacity}</strong></div><div class="provisioning-meter"><span>Endurance</span><strong>${enduranceDays(loadout)} days</strong></div><div class="provisioning-meter"><span>Daily water</span><strong>${(people * .003).toFixed(3)} t</strong></div><div class="provisioning-meter"><span>Daily provisions</span><strong>${(people * .0015).toFixed(3)} t</strong></div><div class="provisioning-meter"><span>Daily wages</span><strong>${dailyWages(loadout)} maravedís</strong></div></div><div class="provisioning-grid">${cargoControls}${crewControls}</div><p class="provisioning-warning ${valid ? '' : 'invalid'}">${valid ? 'Water, provisions, and gold wages are the only live effects in this first pass. Other cargo occupies hold space for future systems.' : used > profile.holdCapacityTons ? 'This load exceeds the ship’s hold capacity.' : people === 0 ? 'Assign at least one crew member.' : 'This crew exceeds the ship’s historical game capacity.'}</p>`;
    provisioningEl.querySelectorAll<HTMLInputElement>('[data-cargo]').forEach((input) => input.addEventListener('input', () => { loadout[input.dataset.cargo as CargoKind] = Number(input.value); render(); }));
    provisioningEl.querySelectorAll<HTMLInputElement>('[data-crew]').forEach((input) => input.addEventListener('input', () => { loadout[input.dataset.crew as 'sailors' | 'soldiers'] = Number(input.value); render(); }));
    overlay.querySelector<HTMLButtonElement>('#pre-start')!.disabled = !valid;
  }

  overlay.querySelector<HTMLButtonElement>('#pre-start')!.addEventListener('click', () => {
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('mission', selectedMission.id);
    url.searchParams.set('ship', selectedShip.id);
    (Object.keys(CARGO_LABELS) as CargoKind[]).forEach((kind) => url.searchParams.set(kind, String(loadout[kind])));
    url.searchParams.set('sailors', String(loadout.sailors));
    url.searchParams.set('soldiers', String(loadout.soldiers));
    url.searchParams.set('play', '1');
    window.location.assign(url);
  });

  render();
}
