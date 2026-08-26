const speedButtons = [...document.querySelectorAll<HTMLButtonElement>('.time-button')];

for (const button of speedButtons) {
  const value = Number(button.dataset.time);
  if (!Number.isFinite(value) || value <= 0) continue;

  const fasterValue = value * 10;
  button.dataset.time = String(fasterValue);
  button.textContent = `${fasterValue}×`;
}
