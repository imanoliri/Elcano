if (new URLSearchParams(window.location.search).has('visual-smoke')) {
  requestAnimationFrame(() => {
    document.querySelector<HTMLElement>('#modal')?.classList.remove('open');
  });
}
