const speedButtons = [...document.querySelectorAll<HTMLButtonElement>('.time-button')];

// Keep Pause (data-time="0") unchanged. The playable simulation speeds are
// intentionally limited to 1×, 4×, 8× and 16× so steering remains controllable.
const oneButton = speedButtons.find((button) => Number(button.dataset.time) === 1);
const fourButton = speedButtons.find((button) => Number(button.dataset.time) === 4);
const sixteenButton = speedButtons.find((button) => Number(button.dataset.time) === 16);

if (oneButton) oneButton.textContent = '1×';
if (fourButton) fourButton.textContent = '4×';
if (sixteenButton) sixteenButton.textContent = '16×';

if (fourButton && sixteenButton && !speedButtons.some((button) => Number(button.dataset.time) === 8)) {
  const eightButton = fourButton.cloneNode(true) as HTMLButtonElement;
  eightButton.dataset.time = '8';
  eightButton.textContent = '8×';
  eightButton.classList.remove('active');
  sixteenButton.before(eightButton);

  // Reuse the existing 4× button's listener so this tweak stays presentation-
  // only and the simulation's time-scale state remains owned by main.ts.
  eightButton.addEventListener('click', () => {
    const originalValue = fourButton.dataset.time;
    fourButton.dataset.time = '8';
    fourButton.click();
    fourButton.dataset.time = originalValue;
    fourButton.classList.remove('active');
    eightButton.classList.add('active');
  });

  for (const button of speedButtons) {
    button.addEventListener('click', () => eightButton.classList.remove('active'));
  }
}
