import './day-counter.css';

const missionTitle = document.querySelector<HTMLElement>('#mission-title');
const elapsed = document.querySelector<HTMLElement>('#elapsed');

if (missionTitle && elapsed) {
  const row = document.createElement('span');
  row.className = 'mission-title-row';

  const day = document.createElement('span');
  day.id = 'mission-day';
  day.className = 'mission-day';
  day.setAttribute('aria-label', 'Voyage day');

  missionTitle.replaceWith(row);
  row.append(missionTitle, day);

  const updateDay = () => {
    // #elapsed is already rendered in days (for example "5.0 d"). Do not
    // divide by 24 again here. Day 1 covers elapsed time [0, 1 day), Day 2
    // covers [1, 2 days), and so on.
    const elapsedDays = Number.parseFloat(elapsed.textContent ?? '0') || 0;
    day.textContent = `Day ${Math.floor(elapsedDays) + 1}`;
  };

  new MutationObserver(updateDay).observe(elapsed, { childList: true, characterData: true, subtree: true });
  updateDay();
}
