import {
  configureDefaultShip,
  type RigPolar,
  type VesselType,
} from './simulation';

type ShipPreset = {
  id: string;
  name: string;
  rigLabel: string;
  description: string;
  vessel: VesselType;
  rig: RigPolar;
};

export const SHIP_PRESETS: readonly ShipPreset[] = [
  {
    id: 'caravel',
    name: 'Caravel',
    rigLabel: 'Mixed rig · agile',
    description: 'Light and responsive, with useful performance at tighter wind angles.',
    vessel: { id: 'caravel-hull', name: 'Caravel', maxThroughWaterSpeedKn: 6.4 },
    rig: {
      id: 'caravel-mixed-rig',
      name: 'Caravel · mixed rig',
      speedScale: 0.47,
      points: [
        { angleDeg: 0, efficiency: 0 },
        { angleDeg: 30, efficiency: 0 },
        { angleDeg: 35, efficiency: 0.28 },
        { angleDeg: 40, efficiency: 0.5 },
        { angleDeg: 50, efficiency: 0.7 },
        { angleDeg: 70, efficiency: 0.9 },
        { angleDeg: 90, efficiency: 1 },
        { angleDeg: 120, efficiency: 0.92 },
        { angleDeg: 150, efficiency: 0.78 },
        { angleDeg: 180, efficiency: 0.66 },
      ],
    },
  },
  {
    id: 'nao',
    name: 'Nao / Carrack',
    rigLabel: 'Balanced rig · default',
    description: 'A balanced exploration ship with dependable performance across most points of sail.',
    vessel: { id: 'nao-carrack', name: 'Nao / carrack', maxThroughWaterSpeedKn: 6 },
    rig: {
      id: 'nao-balanced-rig',
      name: 'Nao / carrack · balanced rig',
      speedScale: 0.45,
      points: [
        { angleDeg: 0, efficiency: 0 },
        { angleDeg: 35, efficiency: 0 },
        { angleDeg: 40, efficiency: 0.42 },
        { angleDeg: 45, efficiency: 0.55 },
        { angleDeg: 60, efficiency: 0.72 },
        { angleDeg: 90, efficiency: 1 },
        { angleDeg: 120, efficiency: 0.95 },
        { angleDeg: 150, efficiency: 0.85 },
        { angleDeg: 180, efficiency: 0.72 },
      ],
    },
  },
  {
    id: 'galleon',
    name: 'Galleon',
    rigLabel: 'Heavy square rig · powerful',
    description: 'Heavy and less versatile upwind, but fast and steady when the wind is abaft the beam.',
    vessel: { id: 'galleon-hull', name: 'Galleon', maxThroughWaterSpeedKn: 7 },
    rig: {
      id: 'galleon-square-rig',
      name: 'Galleon · heavy square rig',
      speedScale: 0.5,
      points: [
        { angleDeg: 0, efficiency: 0 },
        { angleDeg: 42, efficiency: 0 },
        { angleDeg: 48, efficiency: 0.25 },
        { angleDeg: 60, efficiency: 0.55 },
        { angleDeg: 90, efficiency: 0.88 },
        { angleDeg: 120, efficiency: 1 },
        { angleDeg: 150, efficiency: 1 },
        { angleDeg: 180, efficiency: 0.94 },
      ],
    },
  },
  {
    id: 'lateen',
    name: 'Lateen Vessel',
    rigLabel: 'Lateen rig · upwind specialist',
    description: 'Best choice for sailing close to the wind, trading away some downwind power.',
    vessel: { id: 'lateen-hull', name: 'Lateen-rigged vessel', maxThroughWaterSpeedKn: 5.8 },
    rig: {
      id: 'lateen-rig',
      name: 'Lateen rig',
      speedScale: 0.43,
      points: [
        { angleDeg: 0, efficiency: 0 },
        { angleDeg: 25, efficiency: 0 },
        { angleDeg: 30, efficiency: 0.3 },
        { angleDeg: 35, efficiency: 0.55 },
        { angleDeg: 45, efficiency: 0.78 },
        { angleDeg: 60, efficiency: 0.92 },
        { angleDeg: 90, efficiency: 1 },
        { angleDeg: 120, efficiency: 0.86 },
        { angleDeg: 150, efficiency: 0.7 },
        { angleDeg: 180, efficiency: 0.58 },
      ],
    },
  },
  {
    id: 'square',
    name: 'Square-Rigged Vessel',
    rigLabel: 'Square rig · downwind specialist',
    description: 'Poor close to the wind, exceptional on broad reaches and runs.',
    vessel: { id: 'square-hull', name: 'Square-rigged vessel', maxThroughWaterSpeedKn: 6.7 },
    rig: {
      id: 'square-rig',
      name: 'Square rig',
      speedScale: 0.49,
      points: [
        { angleDeg: 0, efficiency: 0 },
        { angleDeg: 45, efficiency: 0 },
        { angleDeg: 55, efficiency: 0.28 },
        { angleDeg: 70, efficiency: 0.58 },
        { angleDeg: 90, efficiency: 0.82 },
        { angleDeg: 120, efficiency: 0.98 },
        { angleDeg: 150, efficiency: 1 },
        { angleDeg: 180, efficiency: 0.98 },
      ],
    },
  },
];

function presetFromUrl(): ShipPreset {
  const requested = new URL(window.location.href).searchParams.get('ship');
  return SHIP_PRESETS.find((preset) => preset.id === requested)
    ?? SHIP_PRESETS.find((preset) => preset.id === 'nao')!;
}

let activePreset = presetFromUrl();
configureDefaultShip(activePreset.vessel, activePreset.rig);

function selectPreset(preset: ShipPreset) {
  activePreset = preset;
  configureDefaultShip(preset.vessel, preset.rig);
  const url = new URL(window.location.href);
  url.searchParams.set('ship', preset.id);
  window.history.replaceState({}, '', url);
  renderSelection();
}

function renderSelection() {
  const container = document.querySelector<HTMLElement>('#ship-selection-options');
  const current = document.querySelector<HTMLElement>('#ship-selection-current');
  if (!container || !current) return;

  current.textContent = `${activePreset.name} · ${activePreset.rigLabel}`;
  container.innerHTML = SHIP_PRESETS.map((preset) => `
    <button class="ship-option ${preset.id === activePreset.id ? 'active' : ''}" type="button" data-ship-id="${preset.id}" aria-pressed="${preset.id === activePreset.id}">
      <strong>${preset.name}</strong>
      <span>${preset.rigLabel}</span>
      <small>${preset.description}</small>
    </button>
  `).join('');

  container.querySelectorAll<HTMLButtonElement>('.ship-option').forEach((button) => {
    button.addEventListener('click', () => {
      const preset = SHIP_PRESETS.find((candidate) => candidate.id === button.dataset.shipId);
      if (preset) selectPreset(preset);
    });
  });
}

function mountShipSelection() {
  const startButton = document.querySelector<HTMLElement>('#start-mission');
  const modalCard = startButton?.closest<HTMLElement>('.modal-card');
  if (!startButton || !modalCard || document.querySelector('#ship-selection')) return;

  const section = document.createElement('section');
  section.id = 'ship-selection';
  section.className = 'ship-selection';
  section.setAttribute('aria-label', 'Select ship and rig');
  section.innerHTML = `
    <div class="ship-selection-heading">
      <div><span class="eyebrow">Ship & rig</span><strong id="ship-selection-current"></strong></div>
      <small>Different rigs use different polar curves.</small>
    </div>
    <div id="ship-selection-options" class="ship-selection-options"></div>
  `;
  modalCard.insertBefore(section, startButton);

  const style = document.createElement('style');
  style.textContent = `
    .ship-selection{margin:18px 0 16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.1)}
    .ship-selection-heading{display:flex;align-items:end;justify-content:space-between;gap:14px;margin-bottom:10px}.ship-selection-heading strong{display:block;margin-top:3px;font-size:.88rem}.ship-selection-heading small{max-width:220px;text-align:right;font-size:.68rem;line-height:1.35;opacity:.58}
    .ship-selection-options{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px}
    .ship-option{min-width:0;min-height:112px;padding:10px 9px;text-align:left;border:1px solid rgba(255,255,255,.11);border-radius:11px;background:rgba(255,255,255,.035);color:#f4efe6}.ship-option:hover{background:rgba(255,255,255,.065)}.ship-option.active{border-color:rgba(232,185,79,.7);background:rgba(232,185,79,.1);box-shadow:inset 0 0 0 1px rgba(232,185,79,.15)}
    .ship-option strong,.ship-option span,.ship-option small{display:block}.ship-option strong{font-size:.78rem;line-height:1.15}.ship-option span{margin-top:4px;color:#d7bc7f;font-size:.59rem;line-height:1.25;text-transform:uppercase;letter-spacing:.04em}.ship-option small{margin-top:7px;font-size:.62rem;line-height:1.3;opacity:.58}
    @media(max-width:720px){.ship-selection-heading{align-items:start}.ship-selection-heading small{max-width:150px}.ship-selection-options{display:flex;overflow-x:auto;overscroll-behavior-x:contain;padding-bottom:4px}.ship-option{flex:0 0 145px}.modal-card{max-height:94dvh;overflow-y:auto}}
  `;
  document.head.appendChild(style);
  renderSelection();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountShipSelection, { once: true });
} else {
  mountShipSelection();
}
