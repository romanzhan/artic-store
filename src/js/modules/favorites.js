import favoritesStore from './favoritesStore.js';

const ACTIVE = 'is-active';

function syncButtons() {
  document.querySelectorAll('[data-product-id]').forEach((card) => {
    const fav = card.querySelector('[data-fav]');
    if (fav) fav.classList.toggle(ACTIVE, favoritesStore.has(Number(card.dataset.productId)));
  });
}

function syncCounters() {
  const count = favoritesStore.count();
  document.querySelectorAll('[data-favorite-count]').forEach((el) => {
    el.textContent = count > 0 ? String(count) : '';
  });
}

function render() {
  syncButtons();
  syncCounters();
}

export function initFavorites() {
  document.addEventListener('click', (event) => {
    const fav = event.target.closest('[data-fav]');
    if (!fav) return;
    event.preventDefault();
    const card = fav.closest('[data-product-id]');
    if (!card) return;
    favoritesStore.toggle(Number(card.dataset.productId));
  });

  favoritesStore.subscribe(render);
  render();
}
