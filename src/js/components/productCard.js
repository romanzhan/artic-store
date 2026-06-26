import { imageUrl, logoUrl, BRAND_SLUG, formatPrice } from '../utils/productAssets.js';
import favoritesStore from '../modules/favoritesStore.js';

function renderBrand(product) {
  if (product.brandMode === 'none') return '';
  if (product.brandMode === 'text') return `<span class="product-card__brand">${product.brand}</span>`;
  const url = logoUrl(BRAND_SLUG[product.brand]);
  return url
    ? `<img class="product-card__brand-logo" src="${url}" alt="${product.brand}" />`
    : `<span class="product-card__brand">${product.brand}</span>`;
}

function renderBadge(product) {
  if (product.oldPrice) {
    const percent = Math.round((1 - product.price / product.oldPrice) * 100);
    return `<span class="product-card__badge">−${percent} %</span>`;
  }
  if (product.label === 'trend') return '<span class="product-card__badge">Тренд</span>';
  if (product.label === 'new') return '<span class="product-card__badge">Новинка</span>';
  return '';
}

function renderPrice(product) {
  if (product.oldPrice) {
    return `
      <span class="product-card__price-old">${formatPrice(product.oldPrice)}</span>
      <span class="product-card__price-new">${formatPrice(product.price)}</span>`;
  }
  return `<span>${formatPrice(product.price)}</span>`;
}

export function renderProductCard(product) {
  const favClass = favoritesStore.has(product.id) ? ' is-active' : '';
  return `
    <article class="product-card" data-product-id="${product.id}">
      <a class="product-card__media" href="/product/${product.id}">
        <img class="product-card__img" src="${imageUrl(product.image)}" alt="${product.title}" loading="lazy" />
        ${renderBadge(product)}
      </a>
      <div class="product-card__info">
        <button class="product-card__fav${favClass}" type="button" aria-label="В избранное" data-fav>
          <svg class="icon product-card__heart product-card__heart--outline" aria-hidden="true"><use href="#icon-favorite"></use></svg>
          <svg class="icon product-card__heart product-card__heart--fill" aria-hidden="true"><use href="#icon-heart"></use></svg>
        </button>
        ${renderBrand(product)}
        <a class="product-card__title" href="/product/${product.id}">${product.title}</a>
        <div class="product-card__price">${renderPrice(product)}</div>
      </div>
    </article>`;
}
