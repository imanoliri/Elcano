function mountShipSelectorButton() {
  const topActions = document.querySelector<HTMLElement>('.top-actions');
  const modal = document.querySelector<HTMLElement>('#modal');
  const selector = document.querySelector<HTMLElement>('#ship-selection');
  if (!topActions || !modal || !selector || document.querySelector('#ship-selector-button')) return;

  const button = document.createElement('button');
  button.id = 'ship-selector-button';
  button.className = 'ship-selector-button';
  button.type = 'button';
  button.setAttribute('aria-label', 'Select ship and rig');

  const updateLabel = () => {
    const current = document.querySelector<HTMLElement>('#ship-selection-current')?.textContent?.trim();
    const shipName = current?.split(' · ')[0] || 'Ship';
    button.textContent = `⛵ ${shipName}`;
  };

  button.addEventListener('click', () => {
    modal.classList.add('open');
    requestAnimationFrame(() => selector.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  });

  topActions.prepend(button);

  const current = document.querySelector<HTMLElement>('#ship-selection-current');
  if (current) new MutationObserver(updateLabel).observe(current, { childList: true, characterData: true, subtree: true });
  updateLabel();

  const style = document.createElement('style');
  style.textContent = `
    .ship-selector-button{pointer-events:auto;border:1px solid rgba(235,208,152,.32);background:rgba(7,24,34,.82);color:#f4efe6;border-radius:999px;padding:.55rem .82rem;font:600 12px/1 system-ui,sans-serif;white-space:nowrap;box-shadow:0 8px 24px rgba(0,0,0,.2);backdrop-filter:blur(14px)}
    .ship-selector-button:active{transform:scale(.97)}
    @media(max-width:640px){.ship-selector-button{max-width:132px;padding:.52rem .65rem;font-size:11px;overflow:hidden;text-overflow:ellipsis}}
  `;
  document.head.appendChild(style);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountShipSelectorButton, { once: true });
else mountShipSelectorButton();
