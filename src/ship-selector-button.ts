function mountShipSelectorButton() {
  const topActions = document.querySelector<HTMLElement>('.top-actions');
  const modal = document.querySelector<HTMLElement>('#modal');
  if (!topActions || !modal || document.querySelector('#ship-selector-button')) return;

  const button = document.createElement('button');
  button.id = 'ship-selector-button';
  button.className = 'ship-selector-button';
  button.type = 'button';
  button.textContent = '⛵ Ship';
  button.setAttribute('aria-label', 'Select ship and rig');

  const updateLabel = () => {
    const current = document.querySelector<HTMLElement>('#ship-selection-current')?.textContent?.trim();
    const shipName = current?.split(' · ')[0] || 'Ship';
    button.textContent = `⛵ ${shipName}`;
  };

  const bindCurrentLabel = () => {
    const current = document.querySelector<HTMLElement>('#ship-selection-current');
    if (!current) return false;
    new MutationObserver(updateLabel).observe(current, { childList: true, characterData: true, subtree: true });
    updateLabel();
    return true;
  };

  button.addEventListener('click', () => {
    modal.classList.add('open');
    requestAnimationFrame(() => {
      const selector = document.querySelector<HTMLElement>('#ship-selection');
      if (selector) selector.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  });

  topActions.prepend(button);
  if (!bindCurrentLabel()) {
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (bindCurrentLabel() || attempts >= 20) window.clearInterval(timer);
    }, 100);
  }

  const style = document.createElement('style');
  style.textContent = `
    .ship-selector-button{pointer-events:auto;border:1px solid rgba(235,208,152,.55);background:rgba(7,24,34,.92);color:#f4efe6;border-radius:999px;padding:.58rem .9rem;font:700 12px/1 system-ui,sans-serif;white-space:nowrap;box-shadow:0 8px 24px rgba(0,0,0,.25);backdrop-filter:blur(14px)}
    .ship-selector-button:active{transform:scale(.97)}
    @media(max-width:640px){.ship-selector-button{max-width:132px;padding:.55rem .7rem;font-size:11px;overflow:hidden;text-overflow:ellipsis}}
  `;
  document.head.appendChild(style);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountShipSelectorButton, { once: true });
else mountShipSelectorButton();
