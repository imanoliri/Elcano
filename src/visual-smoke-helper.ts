if (new URLSearchParams(window.location.search).has('visual-smoke')) {
  requestAnimationFrame(() => {
    document.querySelector<HTMLElement>('#modal')?.classList.remove('open');
  });

  // Exercise a much deeper zoom so CI verifies the 10m coastline and
  // zoom-aware marker layers well beyond the default tutorial scale.
  window.setTimeout(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('#ocean');
    const shell = document.querySelector<HTMLElement>('.game-shell');
    if (!canvas || !shell) return;
    const rect = shell.getBoundingClientRect();
    canvas.dispatchEvent(new WheelEvent('wheel', {
      clientX: rect.left + rect.width * 0.5,
      clientY: rect.top + rect.height * 0.5,
      deltaY: -1600,
      bubbles: true,
      cancelable: true,
    }));
  }, 700);
}
