import mockApi from '../api/mockApi.js';
import { renderProductCard } from '../components/productCard.js';
import { renderCheck } from '../components/check.js';
import { routePath } from '../utils/base.js';
import { renderBreadcrumbs } from '../utils/breadcrumbs.js';

const SORT_LABELS = {
  popular: 'По популярности',
  'price-asc': 'Сначала дешевле',
  'price-desc': 'Сначала дороже',
};

let root = null;
let data = null;

function parseLocation() {
  const out = {};
  const parts = routePath().replace(/^\/+|\/+$/g, '').split('/');
  if (parts[0] === 'catalog') {
    if (parts[1] === 'sale') {
      out.sale = '1';
    } else {
      if (parts[1]) out.gender = parts[1];
      if (parts[2]) out.group = parts[2];
      if (parts[3]) out.category = parts[3];
    }
  }
  for (const [key, value] of new URLSearchParams(window.location.search).entries()) out[key] = value;
  return out;
}

function buildUrl(overrides = {}, { resetPage = true } = {}) {
  const params = new URLSearchParams(window.location.search);
  if (resetPage) params.delete('page');
  for (const [key, value] of Object.entries(overrides)) {
    const empty = value == null || value === '' || (Array.isArray(value) && value.length === 0);
    if (empty) params.delete(key);
    else params.set(key, Array.isArray(value) ? value.join(',') : value);
  }
  const query = params.toString();
  return query ? `${window.location.pathname}?${query}` : window.location.pathname;
}

async function loadCatalog() {
  data = await mockApi.getCatalog(parseLocation());
  render();
  root.querySelectorAll('[data-price]').forEach((wrap) => syncPrice(wrap));
}

async function go(url) {
  window.history.pushState({}, '', url);
  await loadCatalog();
}

function renderBack(href) {
  return `
    <button class="catalog__back" type="button" data-catalog-back-btn data-href="${href}" aria-label="Назад">
      <svg class="icon icon--flip" aria-hidden="true"><use href="#icon-arrow-right"></use></svg>
    </button>`;
}

function smartBack(href) {
  let sameSite = false;
  try {
    sameSite = Boolean(document.referrer) && new URL(document.referrer).origin === window.location.origin;
  } catch {
    sameSite = false;
  }
  if (sameSite && window.history.length > 1) window.history.back();
  else window.location.href = href;
}

function renderNav(tree) {
  const subItem = (s) =>
    `<li><a class="cat-nav__sublink${s.active ? ' cat-nav__sublink--active' : ''}" href="${s.href}">${s.label}</a></li>`;

  const marker = '<svg class="icon cat-nav__marker" aria-hidden="true"><use href="#icon-arrow-circle"></use></svg>';
  const groupItem = (g) => `
    <li class="cat-nav__group-item${g.active ? ' cat-nav__group-item--active' : ''}">
      <a class="cat-nav__group" href="${g.href}">${g.active ? marker : ''}${g.label}</a>
      ${g.active ? `<ul class="cat-nav__sub">${g.subs.map(subItem).join('')}</ul>` : ''}
    </li>`;

  const genderItem = (gn) => `
    <li class="cat-nav__item${gn.active ? ' cat-nav__item--active' : ''}">
      <a class="cat-nav__gender" href="${gn.href}">${gn.label}</a>
      <ul class="cat-nav__groups">${gn.groups.map(groupItem).join('')}</ul>
    </li>`;

  return `<ul class="cat-nav__list">${tree.map(genderItem).join('')}</ul>`;
}

const checkOption = (group, value, label, checked) => `
  <li class="filter__option">
    ${renderCheck({ label, attrs: `data-filter-value name="${group}" value="${value}"${checked ? ' checked' : ''}` })}
  </li>`;

function chip(key, label, count) {
  const marker =
    count > 0
      ? `<span class="filter-chip__marker filter-chip__marker--count">${count}</span>`
      : `<span class="filter-chip__marker"><svg class="icon filter-chip__chevron" aria-hidden="true"><use href="#icon-chevron"></use></svg></span>`;
  return `
    <button class="filter-chip" type="button" data-filter-toggle="${key}" aria-haspopup="true" aria-expanded="false">
      <span class="filter-chip__label">${label}</span>
      ${marker}
    </button>`;
}

function checkboxFilter(key, label, options, applied, formatValue = (v) => v) {
  return `
    <div class="filter" data-filter="${key}">
      ${chip(key, label, applied.length)}
      <div class="filter__panel" data-filter-panel hidden>
        <div class="filter__search">
          <svg class="icon filter__search-icon" aria-hidden="true"><use href="#icon-search"></use></svg>
          <input class="filter__search-input" type="search" placeholder="Поиск" data-filter-search aria-label="Поиск в фильтре" />
        </div>
        <ul class="filter__options">
          ${options.map((o) => checkOption(key, o, formatValue(o), applied.map(String).includes(String(o)))).join('')}
        </ul>
        <div class="filter__actions">
          <button class="filter__reset" type="button" data-filter-reset="${key}">Сбросить</button>
          <button class="btn btn--filled filter__apply" type="button" data-filter-apply="${key}">Применить</button>
        </div>
      </div>
    </div>`;
}

function priceFilter(price, applied) {
  const { min, max } = price;
  const curMin = applied.priceMin != null ? applied.priceMin : min;
  const curMax = applied.priceMax != null ? applied.priceMax : max;
  const active = applied.priceMin != null || applied.priceMax != null;
  const fmt = (v) => v.toLocaleString('ru-RU');
  const chipLabel = active ? `${fmt(curMin)} – ${fmt(curMax)}` : 'Цена';
  return `
    <div class="filter filter--price" data-filter="price">
      ${chip('price', chipLabel, 0)}
      <div class="filter__panel" data-filter-panel hidden>
        <div class="price-filter" data-price data-min="${min}" data-max="${max}">
          <div class="price">
            <div class="price__track"><span class="price__fill" data-price-fill></span></div>
            <input class="price__range price__range--min" type="range" min="${min}" max="${max}" value="${curMin}" step="1000" data-price-range="min" aria-label="Цена от" />
            <input class="price__range price__range--max" type="range" min="${min}" max="${max}" value="${curMax}" step="1000" data-price-range="max" aria-label="Цена до" />
          </div>
          <div class="price__inputs">
            <input class="price__input" type="number" inputmode="numeric" value="${curMin}" data-price-input="min" aria-label="Цена от" />
            <span class="price__dash">—</span>
            <input class="price__input" type="number" inputmode="numeric" value="${curMax}" data-price-input="max" aria-label="Цена до" />
          </div>
        </div>
        <div class="filter__actions">
          <button class="filter__reset" type="button" data-filter-reset="price">Сбросить</button>
          <button class="btn btn--filled filter__apply" type="button" data-filter-apply="price">Применить</button>
        </div>
      </div>
    </div>`;
}

function sortControl(sort) {
  const options = Object.entries(SORT_LABELS)
    .map(([value, label]) => `<li><button class="sort__option${value === sort ? ' sort__option--active' : ''}" type="button" data-sort="${value}">${label}</button></li>`)
    .join('');
  return `
    <div class="filter filter--sort" data-filter="sort">
      <button class="filter-bar__sort" type="button" data-filter-toggle="sort" aria-haspopup="true" aria-expanded="false" aria-label="Сортировка">
        <svg class="icon filter-bar__sort-icon" aria-hidden="true"><use href="#icon-sort"></use></svg>
        <span class="filter-bar__sort-text">${SORT_LABELS[sort]}</span>
      </button>
      <div class="filter__panel filter__panel--sort" data-filter-panel hidden>
        <ul class="sort__list">${options}</ul>
      </div>
    </div>`;
}

function renderFilters(filters) {
  const a = filters.applied;
  return `
    <div class="filter-bar__filters">
      ${checkboxFilter('brands', 'Бренд', filters.brands, a.brands)}
      ${priceFilter(filters.price, a)}
      ${checkboxFilter('sizes', 'Размер', filters.sizes, a.sizes)}
      ${checkboxFilter('colors', 'Цвет', filters.colors, a.colors)}
    </div>
    ${sortControl(a.sort)}`;
}

function renderPagination(page, totalPages) {
  if (totalPages <= 1) return '';
  const link = (p, label, opts = {}) => {
    if (opts.disabled) return `<span class="pagination__item pagination__item--disabled">${label}</span>`;
    if (opts.current) return `<span class="pagination__item pagination__item--current" aria-current="page">${label}</span>`;
    return `<a class="pagination__item" href="${buildUrl({ page: p }, { resetPage: false })}">${label}</a>`;
  };
  const nums = [];
  for (let p = 1; p <= totalPages; p += 1) nums.push(link(p, p, { current: p === page }));
  return `
    ${link(page - 1, '‹', { disabled: page === 1 })}
    ${nums.join('')}
    ${link(page + 1, '›', { disabled: page === totalPages })}`;
}

function render() {
  const crumbs = root.querySelector('[data-breadcrumbs]');
  if (crumbs) crumbs.innerHTML = renderBreadcrumbs(data.breadcrumbs);

  const title = root.querySelector('[data-catalog-title]');
  if (title) title.textContent = data.title;

  const back = root.querySelector('[data-catalog-back]');
  if (back) {
    const isRoot = !data.gender && !data.group && !data.category && !data.sale && !data.brand;
    back.innerHTML = isRoot ? '' : renderBack(data.breadcrumbs[data.breadcrumbs.length - 2].href);
  }

  const nav = root.querySelector('[data-catalog-nav]');
  if (nav) nav.innerHTML = renderNav(data.tree);

  const bar = root.querySelector('[data-catalog-filters]');
  if (bar) bar.innerHTML = renderFilters(data.filters);

  const grid = root.querySelector('[data-product-grid]');
  if (grid) {
    grid.innerHTML = data.products.length
      ? data.products.map(renderProductCard).join('')
      : '<p class="catalog__empty">В этой категории пока нет товаров</p>';
  }

  const pag = root.querySelector('[data-pagination]');
  if (pag) pag.innerHTML = renderPagination(data.page, data.totalPages);

  placeSort();
}

function placeSort() {
  const sort = root.querySelector('.filter--sort');
  const head = root.querySelector('[data-catalog-head]');
  const bar = root.querySelector('[data-catalog-filters]');
  if (!sort || !head || !bar) return;
  const target = window.matchMedia('(max-width: 768px)').matches ? head : bar;
  if (sort.parentElement !== target) target.appendChild(sort);
}

function closePanels(except) {
  root.querySelectorAll('[data-filter-toggle]').forEach((btn) => {
    if (btn === except) return;
    btn.setAttribute('aria-expanded', 'false');
    const panel = btn.parentElement.querySelector('[data-filter-panel]');
    if (panel) panel.hidden = true;
  });
}

function positionPanel(btn, panel) {
  const margin = 8;
  const rect = btn.getBoundingClientRect();
  const pw = panel.offsetWidth;
  const ph = panel.offsetHeight;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let left = rect.left;
  if (left + pw > vw - margin) left = rect.right - pw;
  left = Math.max(margin, Math.min(left, vw - pw - margin));

  let top = rect.bottom + margin;
  const fitsBelow = top + ph <= vh - margin;
  const fitsAbove = rect.top - margin - ph >= margin;
  if (!fitsBelow && fitsAbove) top = rect.top - margin - ph;
  top = Math.max(margin, Math.min(top, vh - ph - margin));

  panel.style.left = `${Math.round(left)}px`;
  panel.style.top = `${Math.round(top)}px`;
}

function togglePanel(btn) {
  const expanded = btn.getAttribute('aria-expanded') === 'true';
  closePanels(expanded ? null : btn);
  btn.setAttribute('aria-expanded', String(!expanded));
  const panel = btn.parentElement.querySelector('[data-filter-panel]');
  if (!panel) return;
  panel.hidden = expanded;
  if (!expanded) positionPanel(btn, panel);
}

function applyCheckbox(key) {
  const inputs = root.querySelectorAll(`[data-filter="${key}"] [data-filter-value]:checked`);
  const values = [...inputs].map((i) => i.value);
  go(buildUrl({ [key]: values }));
}

function applyPrice() {
  const wrap = root.querySelector('[data-filter="price"]');
  normalizePrice(wrap.querySelector('[data-price]'));
  const min = wrap.querySelector('[data-price-input="min"]').value;
  const max = wrap.querySelector('[data-price-input="max"]').value;
  go(buildUrl({ priceMin: min, priceMax: max }));
}

function syncPrice(wrap, fromInput = false) {
  const rMin = wrap.querySelector('[data-price-range="min"]');
  const rMax = wrap.querySelector('[data-price-range="max"]');
  const iMin = wrap.querySelector('[data-price-input="min"]');
  const iMax = wrap.querySelector('[data-price-input="max"]');
  const fill = wrap.querySelector('[data-price-fill]');
  if (fromInput) {
    if (iMin.value !== '') rMin.value = iMin.value;
    if (iMax.value !== '') rMax.value = iMax.value;
  } else {
    const lo = Math.min(Number(rMin.value), Number(rMax.value));
    const hi = Math.max(Number(rMin.value), Number(rMax.value));
    rMin.value = lo;
    rMax.value = hi;
    iMin.value = lo;
    iMax.value = hi;
  }
  const min = Number(wrap.dataset.min);
  const max = Number(wrap.dataset.max);
  const span = max - min || 1;
  const lo = Math.min(Number(rMin.value), Number(rMax.value));
  const hi = Math.max(Number(rMin.value), Number(rMax.value));
  fill.style.insetInlineStart = `${((lo - min) / span) * 100}%`;
  fill.style.insetInlineEnd = `${100 - ((hi - min) / span) * 100}%`;
}

function normalizePrice(wrap) {
  const min = Number(wrap.dataset.min);
  const max = Number(wrap.dataset.max);
  const iMin = wrap.querySelector('[data-price-input="min"]');
  const iMax = wrap.querySelector('[data-price-input="max"]');
  const clamp = (value, fallback) =>
    value === '' || Number.isNaN(Number(value)) ? fallback : Math.min(max, Math.max(min, Number(value)));
  let lo = clamp(iMin.value, min);
  let hi = clamp(iMax.value, max);
  if (lo > hi) [lo, hi] = [hi, lo];
  iMin.value = lo;
  iMax.value = hi;
  syncPrice(wrap, true);
}

function onClick(event) {
  const backBtn = event.target.closest('[data-catalog-back-btn]');
  if (backBtn) {
    smartBack(backBtn.dataset.href);
    return;
  }

  const pageLink = event.target.closest('a.pagination__item');
  if (pageLink) {
    event.preventDefault();
    go(pageLink.getAttribute('href'));
    root.querySelector('[data-product-grid]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  const toggle = event.target.closest('[data-filter-toggle]');
  if (toggle && root.contains(toggle)) {
    togglePanel(toggle);
    return;
  }

  if (event.target.closest('[data-filter-panel]')) {
    const applyKey = event.target.closest('[data-filter-apply]')?.dataset.filterApply;
    if (applyKey === 'price') return applyPrice();
    if (applyKey) return applyCheckbox(applyKey);

    const resetKey = event.target.closest('[data-filter-reset]')?.dataset.filterReset;
    if (resetKey === 'price') return go(buildUrl({ priceMin: null, priceMax: null }));
    if (resetKey) return go(buildUrl({ [resetKey]: null }));

    const sortBtn = event.target.closest('[data-sort]');
    if (sortBtn) return go(buildUrl({ sort: sortBtn.dataset.sort }));
    return;
  }

  if (!event.target.closest('.filter')) closePanels(null);
}

function onInput(event) {
  const search = event.target.closest('[data-filter-search]');
  if (search) {
    const q = search.value.trim().toLowerCase();
    search.closest('[data-filter-panel]').querySelectorAll('.filter__option').forEach((li) => {
      li.hidden = !li.textContent.toLowerCase().includes(q);
    });
    return;
  }

  const priceEl = event.target.closest('[data-price-range], [data-price-input]');
  if (priceEl) syncPrice(priceEl.closest('[data-price]'), priceEl.hasAttribute('data-price-input'));
}

function onChange(event) {
  const input = event.target.closest('[data-price-input]');
  if (input) normalizePrice(input.closest('[data-price]'));
}

export async function initCatalog() {
  root = document.querySelector('[data-catalog]');
  if (!root) return;

  await loadCatalog();

  root.addEventListener('click', onClick);
  root.addEventListener('input', onInput);
  root.addEventListener('change', onChange);
  window.addEventListener('popstate', loadCatalog);
  window.addEventListener('scroll', () => closePanels(null), { passive: true });
  window.addEventListener('resize', () => {
    closePanels(null);
    placeSort();
  });

  const filterBar = root.querySelector('[data-catalog-filters]');
  if (filterBar) enableDragScroll(filterBar);
}

function enableDragScroll(el) {
  let down = false;
  let moved = false;
  let startX = 0;
  let startLeft = 0;

  el.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'touch' || el.scrollWidth <= el.clientWidth) return;
    down = true;
    moved = false;
    startX = event.clientX;
    startLeft = el.scrollLeft;
  });

  window.addEventListener('pointermove', (event) => {
    if (!down) return;
    const dx = event.clientX - startX;
    if (Math.abs(dx) > 3 && !moved) {
      moved = true;
      el.classList.add('is-dragging');
    }
    el.scrollLeft = startLeft - dx;
  });

  window.addEventListener('pointerup', () => {
    if (!down) return;
    down = false;
    el.classList.remove('is-dragging');
  });

  el.addEventListener(
    'click',
    (event) => {
      if (moved) {
        event.stopPropagation();
        event.preventDefault();
        moved = false;
      }
    },
    true,
  );

  el.addEventListener(
    'wheel',
    (event) => {
      if (el.scrollWidth <= el.clientWidth || event.deltaY === 0) return;
      event.preventDefault();
      el.scrollLeft += event.deltaY;
    },
    { passive: false },
  );
}
