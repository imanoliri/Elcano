export type KeyboardAction = 'helmPort' | 'helmStarboard' | 'sailsRaise' | 'sailsLower' | 'centerHelm' | 'anchor' | 'camera' | 'navigation' | 'zoomIn' | 'zoomOut' | 'pauseResume' | 'speed1' | 'speed4' | 'speed8' | 'speed16' | 'restart' | 'instructions' | 'missionMenu';
type Definition = { id: KeyboardAction; label: string; hint: string; defaults: string[] };
const STORAGE_KEY = 'elcano.keyboard-controls.v1';
const controls: Definition[] = [
  { id: 'helmPort', label: 'Steer port', hint: 'Turn the helm to port.', defaults: ['ArrowLeft', 'a'] },
  { id: 'helmStarboard', label: 'Steer starboard', hint: 'Turn the helm to starboard.', defaults: ['ArrowRight', 'd'] },
  { id: 'sailsRaise', label: 'Raise sails', hint: 'Increase sail area.', defaults: ['ArrowUp', 'w'] },
  { id: 'sailsLower', label: 'Lower sails', hint: 'Reduce sail area.', defaults: ['ArrowDown', 's'] },
  { id: 'centerHelm', label: 'Center helm', hint: 'Return the rudder to centre.', defaults: ['z'] },
  { id: 'anchor', label: 'Drop / raise anchor', hint: 'Toggle the anchor in coastal water.', defaults: ['x'] },
  { id: 'camera', label: 'Camera mode', hint: 'Toggle static and follow-ship camera.', defaults: ['c'] },
  { id: 'navigation', label: 'Navigation mode', hint: 'Toggle direct and waypoint planning.', defaults: ['v'] },
  { id: 'zoomIn', label: 'Zoom in', hint: 'Zoom the chart in around its centre.', defaults: ['+'] },
  { id: 'zoomOut', label: 'Zoom out', hint: 'Zoom the chart out around its centre.', defaults: ['-'] },
  { id: 'pauseResume', label: 'Pause / resume', hint: 'Pause, or resume at 1×.', defaults: [' ', '0'] },
  { id: 'speed1', label: 'Set 1× time', hint: 'Sail at normal time.', defaults: ['1'] },
  { id: 'speed4', label: 'Set 4× time', hint: 'Sail at four times speed.', defaults: ['2'] },
  { id: 'speed8', label: 'Set 8× time', hint: 'Sail at eight times speed.', defaults: ['3'] },
  { id: 'speed16', label: 'Set 16× time', hint: 'Sail at sixteen times speed.', defaults: ['4'] },
  { id: 'restart', label: 'Restart mission', hint: 'Restart the current mission.', defaults: ['r'] },
  { id: 'instructions', label: 'Mission instructions', hint: 'Open the current briefing.', defaults: ['?'] },
  { id: 'missionMenu', label: 'Mission menu', hint: 'Open the in-mission menu.', defaults: ['m'] },
];
type Bindings = Record<KeyboardAction, string[]>;
const defaultBindings = (): Bindings => Object.fromEntries(controls.map((control) => [control.id, [...control.defaults]])) as Bindings;
export function getKeyboardBindings(): Bindings { try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); if (value && controls.every(({ id }) => Array.isArray(value[id]))) return value; } catch {} return defaultBindings(); }
function save(bindings: Bindings) { localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings)); }
export function actionForKeyboardEvent(event: KeyboardEvent): KeyboardAction | null { const key = event.key.length === 1 ? event.key.toLowerCase() : event.key; return controls.find((control) => getKeyboardBindings()[control.id].includes(key))?.id ?? null; }
const displayKey = (key: string) => key === ' ' ? 'Space' : ({ ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓' } as Record<string, string>)[key] ?? key.toUpperCase();
export function createKeyboardControlsPanel() {
  if (!document.querySelector('#keyboard-controls-style')) {
    const style = document.createElement('style'); style.id = 'keyboard-controls-style'; style.textContent = `.keyboard-controls{border:1px solid rgba(255,255,255,.12);border-radius:14px;background:rgba(255,255,255,.035)}.keyboard-controls summary{padding:14px;cursor:pointer;font-weight:800;color:#f1d38d}.keyboard-controls summary span{float:right;font-size:.7rem;letter-spacing:.08em;text-transform:uppercase;opacity:.72}.keyboard-controls>p{margin:0;padding:0 14px 13px;opacity:.64;font-size:.78rem;line-height:1.45}.keyboard-controls-list{display:grid;gap:1px;border-top:1px solid rgba(255,255,255,.09)}.keyboard-control-row{display:grid;grid-template-columns:minmax(130px,1fr) minmax(150px,auto);align-items:center;gap:12px;padding:10px 14px;background:rgba(0,0,0,.06)}.keyboard-control-row strong,.keyboard-control-row small{display:block}.keyboard-control-row strong{font-size:.78rem}.keyboard-control-row small{margin-top:2px;font-size:.67rem;opacity:.55}.keyboard-binding-list{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:5px}.keyboard-binding,.keyboard-add-binding,.keyboard-controls-reset{border:1px solid rgba(232,185,79,.35);border-radius:7px;background:rgba(232,185,79,.1);color:#f4efe6;font-weight:800;font-size:.7rem}.keyboard-binding{min-width:34px;padding:5px 7px}.keyboard-add-binding{padding:5px 7px;opacity:.78}.keyboard-binding.is-capturing{min-width:96px}.keyboard-controls-reset{margin:12px 14px;padding:7px 10px}.keyboard-controls-reset:hover,.keyboard-binding:hover,.keyboard-add-binding:hover{background:rgba(232,185,79,.2)}@media(max-width:500px){.keyboard-control-row{grid-template-columns:1fr}.keyboard-binding-list{justify-content:flex-start}}`; document.head.appendChild(style);
  }
  const details = document.createElement('details'); details.className = 'keyboard-controls';
  details.innerHTML = `<summary>Keyboard controls <span>Configure</span></summary><p>Arrow keys and WASD steer and adjust sails by default. Click a binding, then press a key.</p><div class="keyboard-controls-list"></div><button class="keyboard-controls-reset" type="button">Restore defaults</button>`;
  const list = details.querySelector<HTMLElement>('.keyboard-controls-list')!;
  const render = () => {
    const bindings = getKeyboardBindings();
    list.innerHTML = controls.map((control) => `<div class="keyboard-control-row"><div><strong>${control.label}</strong><small>${control.hint}</small></div><div class="keyboard-binding-list">${bindings[control.id].map((key) => `<button class="keyboard-binding" data-action="${control.id}" data-key="${key}" type="button">${displayKey(key)}</button>`).join('')}<button class="keyboard-add-binding" data-action="${control.id}" type="button">Add key</button></div></div>`).join('');
    list.querySelectorAll<HTMLButtonElement>('.keyboard-binding, .keyboard-add-binding').forEach((button) => button.addEventListener('click', () => {
      const action = button.dataset.action as KeyboardAction; const oldKey = button.dataset.key; button.textContent = 'Press a key…'; button.classList.add('is-capturing');
      const receive = (event: KeyboardEvent) => { event.preventDefault(); if (event.key === 'Escape') { window.removeEventListener('keydown', receive); return render(); } if (event.ctrlKey || event.metaKey || event.altKey || event.key === 'Tab') return; window.removeEventListener('keydown', receive); const key = event.key.length === 1 ? event.key.toLowerCase() : event.key; const next = getKeyboardBindings(); for (const item of controls) next[item.id] = next[item.id].filter((binding) => binding !== key); next[action] = oldKey ? next[action].map((binding) => binding === oldKey ? key : binding) : [...next[action], key]; save(next); render(); };
      window.addEventListener('keydown', receive);
    }));
  };
  details.querySelector<HTMLButtonElement>('.keyboard-controls-reset')!.addEventListener('click', () => { save(defaultBindings()); render(); }); render(); return details;
}
