import mockApi from '../api/mockApi.js';
import { renderProductCard } from '../components/productCard.js';
import { renderBrand } from '../utils/productAssets.js';
import { showOverlay, hideOverlay } from './overlay.js';
import { createFocusTrap } from '../utils/focusTrap.js';
import { escapeHtml } from '../utils/dom.js';
import { EVENTS, LAYERS } from '../constants.js';

const CLASS_OPEN = 'is-open';
const PRODUCTS_LIMIT = 12;
const DEBOUNCE = 250;

let modal = null;
let input = null;
let clearBtn = null;
let resultsEl = null;
let isOpen = false;
let timer = null;
let currentData = null;
let activeMatch = null;
let wheelEl = null;
let wheelTarget = 0;
let wheelRAF = 0;
let trap = null;

const setTriggersExpanded = (expanded) => {
  document.querySelectorAll('[data-search]').forEach((t) => t.setAttribute('aria-expanded', String(expanded)));
};

const renderSuggestion = (s) => {
  const title = s.brand
    ? renderBrand({ brand: s.brand, brandMode: s.brandMode }, 'search')
    : `<span class="search__suggestion-label">${escapeHtml(s.label)}</span>`;
  const match = s.brand
    ? `data-brand="${s.brand}" data-group="${s.group}" data-gender="${s.gender}"`
    : `data-category="${s.category}" data-gender="${s.gender}"`;
  return `
  <a class="search__suggestion" href="${s.href}" ${match}>
    <span class="search__suggestion-text">
      ${title}
      <span class="search__suggestion-sub">${escapeHtml(s.sub)}</span>
    </span>
    <svg class="icon search__suggestion-arrow" aria-hidden="true"><use href="#icon-arrow-right"></use></svg>
  </a>`;
};

const productsHtml = (products) => products.slice(0, PRODUCTS_LIMIT).map(renderProductCard).join('');

function renderResults(data) {
  currentData = data;
  activeMatch = null;
  const { suggestions, products } = data;
  if (!suggestions.length && !products.length) {
    resultsEl.innerHTML = '';
    return;
  }
  const sugg = suggestions.length
    ? `<div class="search__suggestions">${suggestions.map(renderSuggestion).join('')}</div>`
    : '';
  const prods = products.length
    ? `<div class="search__products"><div class="search__products-track">${productsHtml(products)}</div></div>`
    : '';
  resultsEl.innerHTML = sugg + prods;
}

function setProducts(products) {
  const track = resultsEl.querySelector('.search__products-track');
  if (track) track.innerHTML = productsHtml(products);
}

async function runSearch(query) {
  const data = await mockApi.search(query);
  renderResults(data);
}

function open() {
  if (isOpen) return;
  isOpen = true;
  modal.classList.add(CLASS_OPEN);
  modal.setAttribute('aria-hidden', 'false');
  setTriggersExpanded(true);
  showOverlay();
  document.dispatchEvent(new CustomEvent(EVENTS.layerOpen, { detail: LAYERS.search }));
  trap.activate(input);
}

function close() {
  if (!isOpen) return;
  isOpen = false;
  modal.classList.remove(CLASS_OPEN);
  modal.setAttribute('aria-hidden', 'true');
  setTriggersExpanded(false);
  hideOverlay();
  trap.release();
}

function resetField() {
  input.value = '';
  clearBtn.hidden = true;
  resultsEl.innerHTML = '';
  currentData = null;
  activeMatch = null;
  input.focus();
}

function onInput() {
  const value = input.value;
  clearBtn.hidden = value.length === 0;
  clearTimeout(timer);
  timer = setTimeout(() => runSearch(value), DEBOUNCE);
}

function onModalClick(event) {
  if (event.target.closest('[data-search-close]')) close();
  if (event.target.closest('[data-search-clear]')) resetField();
}

function onResultsOver(event) {
  const suggestion = event.target.closest('[data-gender]');
  if (!suggestion || !currentData) return;
  const { category, gender, brand, group } = suggestion.dataset;
  const key = `${brand ?? category}|${gender}|${group ?? ''}`;
  if (key === activeMatch) return;
  const filtered = brand
    ? currentData.products.filter((p) => p.brand === brand && p.gender === gender && p.group === group)
    : currentData.products.filter((p) => p.gender === gender && p.category === category);
  if (filtered.length) {
    activeMatch = key;
    setProducts(filtered);
  }
}

function onResultsLeave() {
  if (!currentData || activeMatch === null) return;
  activeMatch = null;
  setProducts(currentData.products);
}

function stepWheel() {
  if (!wheelEl) {
    wheelRAF = 0;
    return;
  }
  const diff = wheelTarget - wheelEl.scrollLeft;
  if (Math.abs(diff) < 0.5) {
    wheelEl.scrollLeft = wheelTarget;
    wheelRAF = 0;
    return;
  }
  wheelEl.scrollLeft += diff * 0.2;
  wheelRAF = requestAnimationFrame(stepWheel);
}

function onResultsWheel(event) {
  const products = event.target.closest('.search__products');
  if (!products || products.scrollWidth <= products.clientWidth || event.deltaY === 0) return;
  event.preventDefault();
  const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
  const max = products.scrollWidth - products.clientWidth;
  if (wheelEl !== products) {
    wheelEl = products;
    wheelTarget = products.scrollLeft;
  }
  wheelTarget = Math.max(0, Math.min(max, wheelTarget + delta));
  if (!wheelRAF) wheelRAF = requestAnimationFrame(stepWheel);
}

export function initSearch() {
  modal = document.querySelector('[data-search-modal]');
  if (!modal) return;
  input = modal.querySelector('[data-search-input]');
  clearBtn = modal.querySelector('[data-search-clear]');
  resultsEl = modal.querySelector('[data-search-results]');
  const form = modal.querySelector('[data-search-form]');
  trap = createFocusTrap(modal);

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-search]')) {
      event.preventDefault();
      open();
    }
  });

  input.addEventListener('input', onInput);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearTimeout(timer);
    runSearch(input.value);
  });
  modal.addEventListener('click', onModalClick);
  resultsEl.addEventListener('mouseover', onResultsOver);
  resultsEl.addEventListener('mouseleave', onResultsLeave);
  resultsEl.addEventListener('wheel', onResultsWheel, { passive: false });

  document.addEventListener(EVENTS.overlayClick, close);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });
  window.addEventListener('scroll', () => {
    if (isOpen) close();
  }, { passive: true });
  document.addEventListener(EVENTS.layerOpen, (event) => {
    if (event.detail !== LAYERS.search) close();
  });
}
