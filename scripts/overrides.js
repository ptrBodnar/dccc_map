// The map canvas is useful before location data arrives. Never let a slow sheet
// request obscure it with the loading state.
window.setTimeout(() => {
  document.getElementById('map-loading')?.classList.add('is-hidden');
}, 1200);
