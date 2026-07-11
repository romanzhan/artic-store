import Swiper from 'swiper';
import { Navigation, Pagination, Keyboard, A11y } from 'swiper/modules';
import 'swiper/css';

import mockApi from '../api/mockApi.js';
import { createAssetResolver } from '../utils/assets.js';
import { sliderNavButton } from '../components/sliderNavButton.js';

const imageUrl = createAssetResolver(
  import.meta.glob('../../assets/images/slider/*.webp', { eager: true, query: '?url', import: 'default' }),
);

function renderSlide(slide) {
  return `
    <div class="swiper-slide hero-slider__slide">
      <img class="hero-slider__bg" src="${imageUrl(slide.bg)}" alt="" aria-hidden="true" />
      <div class="hero-slider__panel"></div>
      <div class="container hero-slider__container">
        <div class="hero-slider__content">
          <h2 class="hero-slider__title">${slide.title}</h2>
          <p class="hero-slider__subtitle">${slide.subtitle}</p>
          <a class="btn btn--primary btn--icon-lg btn--compact-mobile btn--filled-mobile hero-slider__btn" href="${slide.button.href}">
            <span>${slide.button.text}</span>
            <svg class="icon btn__icon" aria-hidden="true"><use href="#icon-arrow-circle"></use></svg>
          </a>
        </div>
        <img class="hero-slider__figure" src="${imageUrl(slide.image)}" alt="${slide.title}" />
        <span class="hero-slider__tag">${slide.tag}</span>
      </div>
    </div>`;
}

const heroNav = (dir, label) => sliderNavButton(dir, label, `hero-slider__nav hero-slider__nav--${dir}`);

function render(root, slides) {
  root.innerHTML = `
    <div class="swiper hero-slider__swiper">
      <div class="swiper-wrapper">
        ${slides.map(renderSlide).join('')}
      </div>
    </div>
    ${heroNav('prev', 'Предыдущий слайд')}
    ${heroNav('next', 'Следующий слайд')}
    <div class="hero-slider__pagination" data-pagination></div>`;
}

export async function initHeroSlider() {
  const root = document.querySelector('[data-hero-slider]');
  if (!root) return;

  const slides = await mockApi.getSlides();
  if (!slides.length) return;
  render(root, slides);

  new Swiper(root.querySelector('.hero-slider__swiper'), {
    modules: [Navigation, Pagination, Keyboard, A11y],
    loop: true,
    speed: 500,
    navigation: {
      prevEl: root.querySelector('[data-nav-prev]'),
      nextEl: root.querySelector('[data-nav-next]'),
    },
    pagination: {
      el: root.querySelector('[data-pagination]'),
      clickable: true,
      bulletClass: 'hero-slider__bullet',
      bulletActiveClass: 'is-active',
      renderBullet: (index, className) =>
        `<button class="${className}" type="button" aria-label="Слайд ${index + 1}">${String(index + 1).padStart(2, '0')}.</button>`,
    },
    keyboard: { enabled: true },
  });
}
