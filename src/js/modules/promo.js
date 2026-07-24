import mockApi from '../api/mockApi.js';
import { createAssetResolver } from '../utils/assets.js';

const tileImage = createAssetResolver(
  import.meta.glob('../../assets/images/promo/*.webp', { eager: true, query: '?url', import: 'default' }),
);

function renderTile(tile) {
  return `
    <a class="tile" href="${tile.href}">
      <img class="tile__img" src="${tileImage(tile.image)}" alt="${tile.label}" loading="lazy" />
      <span class="tile__label">${tile.label}</span>
    </a>`;
}

function render(root, data) {
  root.innerHTML = `
    <div class="promo__inner">
      <div class="promo__text">
        <h2 class="promo__title">${data.title}</h2>
        <p class="promo__subtitle">${data.subtitle}</p>
        <a class="btn btn--primary btn--icon-lg btn--compact-mobile promo__btn" href="${data.button.href}">
          <span>${data.button.text}</span>
          <svg class="icon btn__icon" aria-hidden="true"><use href="#icon-arrow-circle"></use></svg>
        </a>
      </div>
      <div class="promo__grid">${data.tiles.map(renderTile).join('')}</div>
    </div>`;
}

export async function initPromo() {
  const root = document.querySelector('[data-promo]');
  if (!root) return;
  const data = await mockApi.getPromo();
  render(root, data);
}
