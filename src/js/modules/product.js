import Swiper from 'swiper';
import { Navigation, Thumbs, EffectFade, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import 'swiper/css/effect-fade';

import GLightbox from 'glightbox';
import 'glightbox/dist/css/glightbox.min.css';

import mockApi from '../api/mockApi.js';
import { routePath } from '../utils/base.js';
import { imageUrl, formatPrice, discountPercent, renderBadge, renderBrand } from '../utils/productAssets.js';
import { renderBreadcrumbs } from '../utils/breadcrumbs.js';
import { setSlot } from '../utils/dom.js';
import { renderActions } from '../components/ctaActions.js';
import { EVENTS } from '../constants.js';
import cartStore from './cartStore.js';
import { setBuyNow } from './orderSummary.js';
import { initSizeChart, openSizeChart } from './sizeChart.js';
import favoritesStore from './favoritesStore.js';
import { mountProductsSlider } from './productsSlider.js';
import { showCartToast } from './cartToast.js';

const RAIL_MAX_HEIGHT = 4000;

let root = null;
let data = null;
let activeImage = 0;
let activeVariant = 0;
let activeSize = null;
let activeTab = 'description';
let lightbox = null;
let thumbsSwiper = null;
let mainSwiper = null;

function openLightbox(index) {
  if (lightbox) lightbox.destroy();
  lightbox = GLightbox({
    elements: data.gallery.map((img) => ({ href: imageUrl(img), type: 'image' })),
    startAt: index,
    loop: true,
  });
  lightbox.open();
}

function renderGallery() {
  const slides = data.gallery
    .map(
      (img) => `
      <div class="swiper-slide">
        <img class="product-gallery__img" src="${imageUrl(img)}" alt="${data.title}" data-gallery-open />
      </div>`,
    )
    .join('');
  const thumbs = data.gallery
    .map(
      (img, i) => `
      <div class="swiper-slide product-gallery__thumb">
        <img src="${imageUrl(img)}" alt="Фото ${i + 1}" loading="lazy" />
      </div>`,
    )
    .join('');
  return `
    <div class="product-gallery">
      <div class="product-gallery__rail">
        <button class="product-gallery__thumb-nav product-gallery__thumb-nav--up" type="button" data-thumb-prev aria-label="Предыдущие фото">
          <svg class="icon" aria-hidden="true"><use href="#icon-chevron"></use></svg>
        </button>
        <div class="swiper product-gallery__thumbs" data-thumbs>
          <div class="swiper-wrapper">${thumbs}</div>
        </div>
        <button class="product-gallery__thumb-nav product-gallery__thumb-nav--down" type="button" data-thumb-next aria-label="Следующие фото">
          <svg class="icon" aria-hidden="true"><use href="#icon-chevron"></use></svg>
        </button>
      </div>
      <div class="product-gallery__main">
        <div class="swiper product-gallery__viewport" data-main>
          <div class="swiper-wrapper">${slides}</div>
        </div>
        ${renderBadge(data, 'product')}
        <button class="slider-nav slider-nav--prev product-gallery__nav product-gallery__nav--prev" type="button" data-gallery-prev aria-label="Предыдущее фото">
          <svg class="icon slider-nav__icon" aria-hidden="true"><use href="#icon-arrow-slider"></use></svg>
        </button>
        <button class="slider-nav slider-nav--next product-gallery__nav product-gallery__nav--next" type="button" data-gallery-next aria-label="Следующее фото">
          <svg class="icon slider-nav__icon" aria-hidden="true"><use href="#icon-arrow-slider"></use></svg>
        </button>
        <div class="product-gallery__pagination" data-pagination></div>
      </div>
    </div>`;
}

function initGallery() {
  const mainBox = root.querySelector('.product-gallery__main');
  const rail = root.querySelector('.product-gallery__rail');
  const applyRailHeight = () => {
    if (getComputedStyle(rail).display === 'none') {
      rail.style.height = '';
      return;
    }
    const h = mainBox.clientHeight;
    if (h > 0 && h < RAIL_MAX_HEIGHT) rail.style.height = `${Math.round(h)}px`;
  };
  applyRailHeight();

  thumbsSwiper = new Swiper(root.querySelector('[data-thumbs]'), {
    modules: [Navigation],
    direction: 'vertical',
    slidesPerView: 3,
    spaceBetween: 12,
    watchSlidesProgress: true,
    slideToClickedSlide: true,
    navigation: {
      prevEl: root.querySelector('[data-thumb-prev]'),
      nextEl: root.querySelector('[data-thumb-next]'),
    },
  });

  mainSwiper = new Swiper(root.querySelector('[data-main]'), {
    modules: [Navigation, Thumbs, EffectFade, Pagination],
    effect: 'fade',
    fadeEffect: { crossFade: true },
    loop: true,
    initialSlide: activeImage,
    navigation: {
      prevEl: root.querySelector('[data-gallery-prev]'),
      nextEl: root.querySelector('[data-gallery-next]'),
    },
    pagination: {
      el: root.querySelector('[data-pagination]'),
      clickable: true,
      bulletClass: 'product-gallery__bullet',
      bulletActiveClass: 'is-active',
      renderBullet: (index, className) =>
        `<button class="${className}" type="button" aria-label="Фото ${index + 1}">${String(index + 1).padStart(2, '0')}.</button>`,
    },
    thumbs: { swiper: thumbsSwiper },
  });

  mainSwiper.on('slideChange', () => {
    activeImage = mainSwiper.realIndex;
  });

  new ResizeObserver(() => {
    applyRailHeight();
    thumbsSwiper.update();
  }).observe(mainBox);
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
    ? `<div class="product__promo">По промокоду <strong>SALE</strong> −${discountPercent(data)} % при заказе с доставкой</div>`
    : '';
  const price = data.oldPrice
    ? `<span class="product__price-old">${formatPrice(data.oldPrice)}</span><span class="product__price-new">${formatPrice(data.price)}</span>`
    : `<span class="product__price-new">${formatPrice(data.price)}</span>`;

  return `
    <div class="product__head">
      ${renderBrand(data, 'product')}
      <button class="product__fav${favActive}" type="button" data-fav aria-label="В избранное">
        <svg class="icon product__heart product__heart--outline" aria-hidden="true"><use href="#icon-favorite"></use></svg>
        <svg class="icon product__heart product__heart--fill" aria-hidden="true"><use href="#icon-heart"></use></svg>
      </button>
    </div>
    <h1 class="product__title">${data.title}</h1>
    <p class="product__article">Артикул: <span class="product__article-value">${data.article}</span></p>

    <div class="product__row">
      <span class="product__label">Цвет: <span class="product__label-value">${data.variants[activeVariant].color}</span></span>
      <div class="product__variants">${variants}</div>
    </div>

    <div class="product__row">
      <span class="product__label">Размер:</span>
      <div class="product__sizes">${sizes}</div>
      <button class="product__size-chart" type="button" data-size-chart>
        <span>Таблица размеров</span>
        <svg class="icon" aria-hidden="true"><use href="#icon-arrow-circle"></use></svg>
      </button>
    </div>

    ${promo}

    <div class="product__price">${price}</div>

    ${renderActions()}`;
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

const slot = (name, html) => setSlot(root, name, html);

function renderTopbar() {
  const parent = [...data.breadcrumbs.slice(0, -1)].reverse().find((item) => item.href) ?? { href: '/catalog', label: 'Каталог' };
  const favActive = favoritesStore.has(data.id) ? ' is-active' : '';
  return `
    <div class="product__topbar">
      <a class="product__back" href="${parent.href}" aria-label="Назад">
        <svg class="icon icon--flip" aria-hidden="true"><use href="#icon-arrow-right"></use></svg>
      </a>
      <span class="product__topbar-title">${parent.label}</span>
      <button class="product__fav product__topbar-fav${favActive}" type="button" data-fav aria-label="В избранное">
        <svg class="icon product__heart product__heart--outline" aria-hidden="true"><use href="#icon-favorite"></use></svg>
        <svg class="icon product__heart product__heart--fill" aria-hidden="true"><use href="#icon-heart"></use></svg>
      </button>
    </div>`;
}

function render() {
  slot('breadcrumbs', renderBreadcrumbs(data.breadcrumbs));
  slot('topbar', renderTopbar());
  slot('gallery', renderGallery());
  slot('info', renderInfo());
  slot('details', renderDetails());
}

function buildLine() {
  const color = data.variants[activeVariant].color;
  const image = data.gallery[activeImage];
  const line = {
    key: `${data.id}:${activeSize}:${activeVariant}`,
    productId: data.id,
    image,
    brand: data.brand,
    title: data.title,
    meta: `${activeSize} | ${color}`,
    price: data.price,
    oldPrice: data.oldPrice,
    href: `/product/${data.id}`,
  };
  return { line, image: imageUrl(image), color };
}

function onClick(event) {
  if (event.target.closest('[data-gallery-open]')) {
    openLightbox(mainSwiper ? mainSwiper.realIndex : activeImage);
    return;
  }
  const variant = event.target.closest('[data-variant]');
  if (variant) {
    activeVariant = Number(variant.dataset.variant);
    const idx = data.gallery.indexOf(data.variants[activeVariant].image);
    if (idx >= 0 && mainSwiper) mainSwiper.slideToLoop(idx);
    slot('info', renderInfo());
    return;
  }
  if (event.target.closest('[data-add-cart]')) {
    const { line, image, color } = buildLine();
    cartStore.add(line);
    showCartToast({ image, brand: data.brand, title: data.title, size: activeSize, color });
    return;
  }
  if (event.target.closest('[data-buy-now]')) {
    setBuyNow(buildLine().line);
    document.dispatchEvent(new CustomEvent(EVENTS.checkoutStart));
    return;
  }
  if (event.target.closest('[data-size-chart]')) return openSizeChart(activeSize);
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

  initSizeChart();
  const id = routePath().split('/').filter(Boolean)[1];
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
  initGallery();

  if (data.related?.length) {
    const relatedRoot = document.querySelector('[data-related]');
    if (relatedRoot) mountProductsSlider(relatedRoot, 'С этим товаром выбирают', data.related);
  }

  root.addEventListener('click', onClick);
}
