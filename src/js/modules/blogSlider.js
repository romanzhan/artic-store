import Swiper from 'swiper';
import { Navigation, A11y } from 'swiper/modules';
import 'swiper/css';

import mockApi from '../api/mockApi.js';
import { createAssetResolver } from '../utils/assets.js';
import { sliderNavButton } from '../components/sliderNavButton.js';

const articleImage = createAssetResolver(
  import.meta.glob('../../assets/images/blog/*.webp', { eager: true, query: '?url', import: 'default' }),
);

function renderArticle(article) {
  return `
    <div class="swiper-slide">
      <article class="article-card">
        <div class="article-card__media">
          <img class="article-card__img" src="${articleImage(article.image)}" alt="${article.title}" loading="lazy" />
        </div>
        <h3 class="article-card__title">${article.title}</h3>
        <a class="btn btn--primary article-card__btn" href="${article.href}">
          <span>Подробнее</span>
          <svg class="icon btn__icon" aria-hidden="true"><use href="#icon-arrow-circle"></use></svg>
        </a>
      </article>
    </div>`;
}

function render(root, articles) {
  const slides = articles.length >= 6 ? articles : [...articles, ...articles, ...articles];
  root.innerHTML = `
    <div class="blog-slider__viewport">
      <div class="swiper blog-slider__swiper">
        <div class="swiper-wrapper">${slides.map(renderArticle).join('')}</div>
      </div>
      ${sliderNavButton('prev', 'Предыдущие статьи', 'slider-nav--edge')}
      ${sliderNavButton('next', 'Следующие статьи', 'slider-nav--edge')}
    </div>`;
}

export async function initBlogSlider() {
  const root = document.querySelector('[data-blog-slider]');
  if (!root) return;

  const articles = await mockApi.getBlog();
  if (!articles.length) return;
  render(root, articles);

  new Swiper(root.querySelector('.blog-slider__swiper'), {
    modules: [Navigation, A11y],
    loop: true,
    slidesPerView: 1.15,
    spaceBetween: 16,
    slidesOffsetBefore: 16,
    slidesOffsetAfter: 16,
    navigation: {
      prevEl: root.querySelector('[data-nav-prev]'),
      nextEl: root.querySelector('[data-nav-next]'),
    },
    breakpoints: {
      769: { slidesPerView: 2.15, spaceBetween: 40, slidesOffsetBefore: 16, slidesOffsetAfter: 16 },
      1025: { slidesPerView: 2, spaceBetween: 40, slidesOffsetBefore: 0, slidesOffsetAfter: 0 },
    },
  });
}
