import mockApi from '../api/mockApi.js';
import { showOverlay, hideOverlay } from './overlay.js';
import { createAssetResolver } from '../utils/assets.js';
import { EVENTS, LAYERS } from '../constants.js';

const bannerUrl = createAssetResolver(
  import.meta.glob('../../assets/images/mega/*.webp', { eager: true, query: '?url', import: 'default' }),
);

const SELECTOR_TRIGGER = '[data-mega-trigger]';
const CLASS_NAV_ACTIVE = 'header__nav-link--active';
const CLASS_OPEN = 'is-open';

let menu = null;
let header = null;
let panel = null;
let activeCategory = null;
let activeTab = null;

const linkItem = (item) => `<li><a class="mega-menu__link" href="${item.href}">${item.label}</a></li>`;

const colTitle = (label, href = '#') => `
  <a class="mega-menu__col-title" href="${href}">
    <span>${label}</span>
    <svg class="mega-menu__col-icon" aria-hidden="true"><use href="#icon-arrow-circle"></use></svg>
  </a>`;

function renderCategory(tab) {
  const subcats = tab.items.map(linkItem).join('');
  const brands = tab.brands.map(linkItem).join('');
  return `
    <div class="mega-menu__cols">
      <div class="mega-menu__col">
        ${colTitle(tab.allLabel, tab.allHref)}
        <ul class="mega-menu__list">${subcats}</ul>
      </div>
      <div class="mega-menu__col">
        ${colTitle('Бренды')}
        <ul class="mega-menu__list">${brands}</ul>
      </div>
    </div>
    ${renderBanner(tab)}`;
}

function renderBanner(tab) {
  const url = bannerUrl(tab.image);
  const img = url ? `<img class="mega-menu__banner-img" src="${url}" alt="" loading="lazy" />` : '';
  const placeholder = url ? '' : ' mega-menu__banner--placeholder';
  return `
    <a class="mega-menu__banner${placeholder}" href="${tab.allHref || '#'}" aria-label="${tab.label}">
      ${img}
      <span class="mega-menu__banner-word">${tab.word}</span>
    </a>`;
}

function renderBrands(tab) {
  const cols = tab.columns
    .map((col) => `<div class="mega-menu__col"><ul class="mega-menu__list">${col.map(linkItem).join('')}</ul></div>`)
    .join('');
  return `
    <div class="mega-menu__brands">
      ${colTitle(tab.allLabel, tab.allHref)}
      <div class="mega-menu__cols mega-menu__cols--brands">${cols}</div>
    </div>`;
}

function render(category) {
  const tabs = category.tabs
    .map((t) => {
      const active = t.id === activeTab ? ' mega-menu__tab--active' : '';
      return `<button class="mega-menu__tab${active}" type="button" data-tab="${t.id}">${t.label}</button>`;
    })
    .join('');

  let body = '';
  if (activeTab) {
    const tab = category.tabs.find((t) => t.id === activeTab);
    body = `<div class="mega-menu__body" data-mega-body>${tab.type === 'brands' ? renderBrands(tab) : renderCategory(tab)}</div>`;
  }

  panel.innerHTML = `
    <div class="container mega-menu__inner${activeTab ? ' mega-menu__inner--expanded' : ''}">
      <div class="mega-menu__tabs">${tabs}</div>
      ${body}
    </div>`;
}

function setNavActive(categoryId) {
  header.querySelectorAll(SELECTOR_TRIGGER).forEach((el) => {
    const isActive = el.dataset.category === categoryId;
    el.classList.toggle(CLASS_NAV_ACTIVE, isActive);
    el.setAttribute('aria-expanded', String(isActive));
  });
}

function open(categoryId) {
  const category = menu.categories.find((c) => c.id === categoryId);
  if (!category) return;
  const wasOpen = activeCategory !== null;
  activeCategory = categoryId;
  if (activeTab && !category.tabs.some((t) => t.id === activeTab)) {
    activeTab = null;
  }
  render(category);
  setNavActive(categoryId);
  panel.classList.add(CLASS_OPEN);
  if (!wasOpen) showOverlay();
  document.dispatchEvent(new CustomEvent(EVENTS.layerOpen, { detail: LAYERS.mega }));
}

function selectTab(tabId) {
  const category = menu.categories.find((c) => c.id === activeCategory);
  if (!category) return;
  activeTab = tabId;
  render(category);
}

function close() {
  if (!activeCategory) return;
  activeCategory = null;
  activeTab = null;
  setNavActive(null);
  panel.classList.remove(CLASS_OPEN);
  hideOverlay();
}

function onHeaderClick(event) {
  const trigger = event.target.closest(SELECTOR_TRIGGER);
  if (trigger) {
    event.preventDefault();
    event.stopPropagation();
    if (activeCategory === trigger.dataset.category) {
      close();
    } else {
      open(trigger.dataset.category);
    }
    return;
  }
}

function onPanelHover(event) {
  const tab = event.target.closest('[data-tab]');
  if (!tab || !activeCategory || tab.dataset.tab === activeTab) return;
  selectTab(tab.dataset.tab);
}

function onOutsideClick(event) {
  if (!activeCategory) return;
  if (header.contains(event.target)) return;
  close();
}

function onKeydown(event) {
  if (event.key === 'Escape') close();
}

export async function initMegaMenu() {
  header = document.querySelector('.header');
  panel = document.querySelector('[data-mega-menu]');
  if (!header || !panel) return;

  menu = await mockApi.getMenu();

  header.addEventListener('click', onHeaderClick);
  panel.addEventListener('mouseover', onPanelHover);
  document.addEventListener('click', onOutsideClick);
  document.addEventListener('keydown', onKeydown);
  window.addEventListener('scroll', () => {
    if (activeCategory) close();
  }, { passive: true });
  document.addEventListener(EVENTS.layerOpen, (event) => {
    if (event.detail !== LAYERS.mega) close();
  });
}
