import './sailing-guide.css';

const resetButton = document.querySelector<HTMLButtonElement>('#reset');
const helpButton = document.querySelector<HTMLButtonElement>('#help');

if (resetButton && helpButton && !document.querySelector('#sailing-info')) {
  const infoButton = document.createElement('button');
  infoButton.id = 'sailing-info';
  infoButton.className = 'icon-button';
  infoButton.type = 'button';
  infoButton.setAttribute('aria-label', 'Open sailing guide');
  infoButton.textContent = 'i';
  resetButton.after(infoButton);

  const modal = document.createElement('div');
  modal.id = 'sailing-guide-modal';
  modal.className = 'modal sailing-guide-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'sailing-guide-title');
  modal.innerHTML = `
    <div class="modal-backdrop"></div>
    <section class="modal-card sailing-guide-card">
      <button class="modal-close" type="button" aria-label="Close sailing guide">×</button>
      <p class="eyebrow">Sailing essentials</p>
      <h1 id="sailing-guide-title">Read the wind, not the destination</h1>
      <div class="sailing-guide-grid">
        <div><strong>Into the wind</strong><span>In irons — sails cannot drive the ship. Turn away and tack.</span></div>
        <div><strong>Close-hauled</strong><span>Nearest useful angle to the wind; slower but lets you work upwind.</span></div>
        <div><strong>Reach</strong><span>Wind from the side. Beam reach is usually your fastest point of sail.</span></div>
        <div><strong>Broad reach / run</strong><span>Wind mostly behind you. Easy distance, but not always the fastest route.</span></div>
      </div>
      <p class="sailing-guide-rule"><strong>Route rule:</strong> choose headings that exploit wind and current. A longer path can beat the direct one.</p>
      <p class="sailing-guide-tip">The Ship forces panel shows your current point of sail.</p>
    </section>
  `;
  document.body.append(modal);

  const close = () => modal.classList.remove('open');
  const open = () => modal.classList.add('open');

  infoButton.addEventListener('click', open);
  modal.querySelector('.modal-close')?.addEventListener('click', close);
  modal.querySelector('.modal-backdrop')?.addEventListener('click', close);
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('open')) close();
  });
}
