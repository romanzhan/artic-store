import mockApi from '../api/mockApi.js';
import { imageUrl, logoUrl, BRAND_SLUG, formatPrice } from '../utils/productAssets.js';
import favoritesStore from './favoritesStore.js';
import { mountProductsSlider } from './productsSlider.js';
import { showCartToast } from './cartToast.js';

const discount = () => Math.round((1 - data.price / data.oldPrice) * 100);

let root = null;
let data = null;
let activeImage = 0;
let activeVariant = 0;
let activeSize = null;
let activeTab = 'description';

function renderBreadcrumbs(items) {
  return items
    .map((item, i) => {
      const last = i === items.length - 1;
      return last || !item.href
        ? `<span class="breadcrumbs__current" aria-current="page">${item.label}</span>`
        : `<a class="breadcrumbs__link" href="${item.href}">${item.label}</a>`;
    })
    .join('<span class="breadcrumbs__sep" aria-hidden="true">/</span>');
}

function renderBadge() {
  if (data.oldPrice) return `<span class="product__badge">−${discount()} %</span>`;
  if (data.label === 'trend') return '<span class="product__badge">Тренд</span>';
  if (data.label === 'new') return '<span class="product__badge">Новинка</span>';
  return '';
}

function renderGallery() {
  const thumbs = data.gallery
    .map(
      (img, i) => `
      <button class="product-gallery__thumb${i === activeImage ? ' is-active' : ''}" type="button" data-thumb="${i}" aria-label="Фото ${i + 1}">
        <img src="${imageUrl(img)}" alt="" loading="lazy" />
      </button>`,
    )
    .join('');
  return `
    <div class="product-gallery">
      <div class="product-gallery__thumbs">${thumbs}</div>
      <div class="product-gallery__main">
        <img class="product-gallery__img" src="${imageUrl(data.gallery[activeImage])}" alt="${data.title}" />
        ${renderBadge()}
        <button class="slider-nav slider-nav--prev product-gallery__nav product-gallery__nav--prev" type="button" data-gallery-prev aria-label="Предыдущее фото">
          <svg class="icon slider-nav__icon" aria-hidden="true"><use href="#icon-arrow-slider"></use></svg>
        </button>
        <button class="slider-nav slider-nav--next product-gallery__nav product-gallery__nav--next" type="button" data-gallery-next aria-label="Следующее фото">
          <svg class="icon slider-nav__icon" aria-hidden="true"><use href="#icon-arrow-slider"></use></svg>
        </button>
      </div>
    </div>`;
}

function renderBrand() {
  if (data.brandMode === 'none') return '';
  const url = data.brandMode === 'logo' ? logoUrl(BRAND_SLUG[data.brand]) : '';
  return url
    ? `<img class="product__brand-logo" src="${url}" alt="${data.brand}" />`
    : `<span class="product__brand">${data.brand}</span>`;
}

function renderInfo() {
  const favActive = favoritesStore.has(data.id) ? ' is-active' : '';
  const variants = data.variants
    .map(
      (v, i) => `
      <button class="product__variant${i === activeVariant ? ' is-active' : ''}" type="button" data-variant="${i}" aria-pressed="${i === activeVariant}" aria-label="${v.color}">
        <img src="${imageUrl(v.image)}" alt="${v.color}" loading="lazy" />
      </button>`,
    )
    .join('');
  const sizes = data.sizes
    .map((s) => `<button class="product__size${activeSize === s ? ' is-active' : ''}" type="button" data-size="${s}">${s}</button>`)
    .join('');
  const promo = data.oldPrice
    ? `<div class="product__promo">По промокоду <strong>SALE</strong> −${discount()} % при заказе с доставкой</div>`
    : '';
  const price = data.oldPrice
    ? `<span class="product__price-old">${formatPrice(data.oldPrice)}</span><span class="product__price-new">${formatPrice(data.price)}</span>`
    : `<span class="product__price-new">${formatPrice(data.price)}</span>`;

  return `
    <div class="product__head">
      ${renderBrand()}
      <button class="product__fav${favActive}" type="button" data-fav aria-label="В избранное">
        <svg class="icon product__heart product__heart--outline" aria-hidden="true"><use href="#icon-favorite"></use></svg>
        <svg class="icon product__heart product__heart--fill" aria-hidden="true"><use href="#icon-heart"></use></svg>
      </button>
    </div>
    <h1 class="product__title">${data.title}</h1>

    <div class="product__row">
      <span class="product__label">Цвет: ${data.variants[activeVariant].color}</span>
      <div class="product__variants">${variants}</div>
    </div>

    <div class="product__row">
      <span class="product__label">Размер:</span>
      <div class="product__sizes">${sizes}</div>
      <a class="product__size-chart" href="#">
        <span>Таблица размеров</span>
        <svg class="icon" aria-hidden="true"><use href="#icon-arrow-circle"></use></svg>
      </a>
    </div>

    <div class="product__divider" aria-hidden="true"></div>

    ${promo}

    <div class="product__price">${price}</div>

    <div class="product__actions">
      <button class="btn btn--filled product__cart" type="button" data-add-cart>Добавить в корзину</button>
      <a class="btn btn--primary product__buy" href="#">
        <span>Купить сейчас</span>
        <svg class="icon btn__icon" aria-hidden="true"><use href="#icon-arrow-circle"></use></svg>
      </a>
    </div>`;
}

function renderDetails() {
  const specs = data.specs
    .map(
      (s) =>
        `<li class="product-specs__row"><span class="product-specs__label">${s.label}</span><span class="product-specs__dots"></span><span class="product-specs__value">${s.value}</span></li>`,
    )
    .join('');
  const content =
    activeTab === 'description'
      ? `<p class="product__text">${data.description}</p>
         <h2 class="product__subtitle">Характеристики</h2>
         <ul class="product-specs">${specs}</ul>`
      : data.delivery.map((paragraph) => `<p class="product__text">${paragraph}</p>`).join('');
  const tab = (id, label) =>
    `<button class="product__tab${activeTab === id ? ' is-active' : ''}" type="button" role="tab" data-tab="${id}">${label}</button>`;
  return `
    <div class="product__tabs" role="tablist">
      ${tab('description', 'Описание')}
      ${tab('delivery', 'Доставка и возврат')}
    </div>
    <div class="product__tab-content">${content}</div>`;
}

const slot = (name, html) => {
  const el = root.querySelector(`[data-${name}]`);
  if (el) el.innerHTML = html;
};

function render() {
  slot('breadcrumbs', renderBreadcrumbs(data.breadcrumbs));
  slot('gallery', renderGallery());
  slot('info', renderInfo());
  slot('details', renderDetails());
}

function onClick(event) {
  const thumb = event.target.closest('[data-thumb]');
  if (thumb) {
    activeImage = Number(thumb.dataset.thumb);
    slot('gallery', renderGallery());
    return;
  }
  if (event.target.closest('[data-gallery-prev]')) {
    activeImage = (activeImage - 1 + data.gallery.length) % data.gallery.length;
    slot('gallery', renderGallery());
    return;
  }
  if (event.target.closest('[data-gallery-next]')) {
    activeImage = (activeImage + 1) % data.gallery.length;
    slot('gallery', renderGallery());
    return;
  }
  const variant = event.target.closest('[data-variant]');
  if (variant) {
    activeVariant = Number(variant.dataset.variant);
    const idx = data.gallery.indexOf(data.variants[activeVariant].image);
    if (idx >= 0) activeImage = idx;
    slot('gallery', renderGallery());
    slot('info', renderInfo());
    return;
  }
  if (event.target.closest('[data-add-cart]')) {
    showCartToast({
      image: imageUrl(data.gallery[activeImage]),
      brand: data.brand,
      title: data.title,
      size: activeSize,
      color: data.variants[activeVariant].color,
    });
    return;
  }
  const size = event.target.closest('[data-size]');
  if (size) {
    activeSize = Number(size.dataset.size);
    slot('info', renderInfo());
    return;
  }
  const tab = event.target.closest('[data-tab]');
  if (tab) {
    activeTab = tab.dataset.tab;
    slot('details', renderDetails());
  }
}

export async function initProduct() {
  root = document.querySelector('[data-product]');
  if (!root) return;

  const id = window.location.pathname.split('/').filter(Boolean)[1];
  data = await mockApi.getProduct(id);
  if (!data) {
    root.innerHTML = '<p class="product__empty">Товар не найден</p>';
    return;
  }

  root.dataset.productId = data.id;
  activeSize = data.sizes[0] ?? null;
  activeVariant = 0;
  activeImage = Math.max(0, data.gallery.indexOf(data.variants[0].image));
  document.title = `${data.title} — Artic Store`;
  render();

  if (data.related?.length) {
    const relatedRoot = document.querySelector('[data-related]');
    if (relatedRoot) mountProductsSlider(relatedRoot, 'С этим товаром выбирают', data.related);
  }

  root.addEventListener('click', onClick);
}
