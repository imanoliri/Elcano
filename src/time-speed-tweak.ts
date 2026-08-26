const speedButtons = [...document.querySelectorAll<HTMLButtonElement>('.time-button')];

for (const button of speedButtons) {
  const value = Number(button.dataset.time);
  if (!Number.isFinite(value) || value <= 0) continue;

  const fasterValue = value * 10;
  button.dataset.time = String(fasterValue);
  button.textContent = `${fasterValue}×`;
}

const fortyButton = speedButtons.find((button) => Number(button.dataset.time) === 40);
const oneSixtyButton = speedButtons.find((button) => Number(button.dataset.time) === 160);

if (fortyButton && oneSixtyButton) {
  const eightyButton = fortyButton.cloneNode(true) as HTMLButtonElement;
  eightyButton.dataset.time = '80';
  eightyButton.textContent = '80×';
  eightyButton.classList.remove('active');
  oneSixtyButton.before(eightyButton);

  eightyButton.addEventListener('click', () => {
    const originalValue = fortyButton.dataset.time;
    fortyButton.dataset.time = '80';
    fortyButton.click();
    fortyButton.dataset.time = originalValue;
    fortyButton.classList.remove('active');
    eightyButton.classList.add('active');
  });

  for (const button of speedButtons) {
    button.addEventListener('click', () => eightyButton.classList.remove('active'));
  }
}
