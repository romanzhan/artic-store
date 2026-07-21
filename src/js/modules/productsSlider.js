import Swiper from 'swiper';
import { Navigation, A11y } from 'swiper/modules';
import 'swiper/css';

import mockApi from '../api/mockApi.js';
import { renderProductCard } from '../components/productCard.js';
import { sliderNavButton } from '../components/sliderNavButton.js';

function render(root, title, products) {
  const slides = products.map((product) => `<div class="swiper-slide">${renderProductCard(product)}</div>`).join('');
  root.innerHTML = `
    <h2 class="products-slider__title">${title}</h2>
    <div class="products-slider__viewport">
      <div class="swiper products-slider__swiper">
        <div class="swiper-wrapper">${slides}</div>
      </div>
      ${sliderNavButton('prev', 'Предыдущие товары', 'slider-nav--edge')}
      ${sliderNavButton('next', 'Следующие товары', 'slider-nav--edge')}
    </div>`;
}

function createSwiper(root) {
  new Swiper(root.querySelector('.products-slider__swiper'), {
    modules: [Navigation, A11y],
    slidesPerView: 1.5,
    spaceBetween: 16,
    slidesOffsetBefore: 16,
    slidesOffsetAfter: 16,
    navigation: {
      prevEl: root.querySelector('[data-nav-prev]'),
      nextEl: root.querySelector('[data-nav-next]'),
    },
    breakpoints: {
      769: { slidesPerView: 3.2, spaceBetween: 24, slidesOffsetBefore: 16, slidesOffsetAfter: 16 },
      1025: { slidesPerView: 4, spaceBetween: 40, slidesOffsetBefore: 0, slidesOffsetAfter: 0 },
    },
  });
}

export function mountProductsSlider(root, title, products) {
  render(root, title, products);
  createSwiper(root);
}

export async function initProductsSlider() {
  const roots = document.querySelectorAll('[data-products-slider]');
  for (const root of roots) {
    const products = await mockApi.getProducts({ sale: root.dataset.source === 'sale', limit: 12 });
    if (!products.length) continue;
    mountProductsSlider(root, root.dataset.title ?? '', products);
  }
}
