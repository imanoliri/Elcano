if (new URLSearchParams(window.location.search).has('visual-smoke')) {
  requestAnimationFrame(() => {
    document.querySelector<HTMLElement>('#modal')?.classList.remove('open');
  });

  // Exercise the close-zoom rendering path so CI captures the high-detail
  // coastline LOD rather than only the default tutorial zoom.
  window.setTimeout(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('#ocean');
    const shell = document.querySelector<HTMLElement>('.game-shell');
    if (!canvas || !shell) return;
    const rect = shell.getBoundingClientRect();
    canvas.dispatchEvent(new WheelEvent('wheel', {
      clientX: rect.left + rect.width * 0.5,
      clientY: rect.top + rect.height * 0.5,
      deltaY: -350,
      bubbles: true,
      cancelable: true,
    }));
  }, 700);
}
