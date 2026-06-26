import mockApi from '../api/mockApi.js';
import { createFocusTrap } from '../utils/focusTrap.js';

const CLASS_OPEN = 'is-open';

let menu = null;
let panel = null;
let isOpen = false;
let trap = null;

const setBurgerExpanded = (expanded) => {
  document.querySelectorAll('[data-burger]').forEach((b) => b.setAttribute('aria-expanded', String(expanded)));
};

const state = {
  level: 'menu',
  gender: 'women',
  expanded: null,
};

const iconBtn = (icon, attr, label, { flip = false, modifier = '' } = {}) =>
  `<button class="mobile-menu__iconbtn${modifier}" type="button" ${attr} aria-label="${label}">
     <svg class="icon${flip ? ' icon--flip' : ''}" aria-hidden="true"><use href="#${icon}"></use></svg>
   </button>`;

function bar(title, withBack) {
  return `
    <div class="mobile-menu__bar">
      <div class="mobile-menu__bar-left">
        ${withBack ? iconBtn('icon-arrow-right', 'data-back', 'Назад', { flip: true }) : ''}
        <span class="mobile-menu__title">${title}</span>
      </div>
      ${iconBtn('icon-close', 'data-close', 'Закрыть', { modifier: ' mobile-menu__iconbtn--close' })}
    </div>`;
}

function chips(activeGender) {
  const items = menu.mobileChips
    .map((c) => {
      if (c.id) {
        const active = c.id === activeGender ? ' chip--active' : '';
        return `<button class="chip${active}" type="button" data-open-catalog data-gender="${c.id}">${c.label}</button>`;
      }
      return `<a class="chip" href="${c.href}">${c.label}</a>`;
    })
    .join('');
  return `<div class="mobile-menu__chips">${items}</div>`;
}

function renderMenu() {
  const pages = menu.pages.map((p) => `<a class="mobile-menu__row" href="${p.href}">${p.label}</a>`).join('');
  return `
    ${bar('Меню', false)}
    <div class="mobile-menu__body">
      ${chips(null)}
      <button class="mobile-menu__row" type="button" data-open-catalog>
        Каталог
        <svg class="icon" aria-hidden="true"><use href="#icon-arrow-right"></use></svg>
      </button>
      ${pages}
    </div>`;
}

function renderTabContent(tab) {
  const links =
    tab.type === 'brands'
      ? tab.columns[0].map((b) => `<a class="mobile-menu__sublink" href="${b.href}">${b.label}</a>`).join('')
      : tab.items.map((i) => `<a class="mobile-menu__sublink" href="${i.href}">${i.label}</a>`).join('');
  return `
    <div class="mobile-menu__sub">
      <a class="mobile-menu__subtitle" href="${tab.allHref || '#'}">${tab.allLabel}</a>
      ${links}
    </div>`;
}

function renderCatalog() {
  const category = menu.categories.find((c) => c.id === state.gender);
  const rows = category.tabs
    .map((tab) => {
      const expanded = state.expanded === tab.id;
      return `
        <button class="mobile-menu__row" type="button" data-acc="${tab.id}">${tab.label}</button>
        ${expanded ? renderTabContent(tab) : ''}`;
    })
    .join('');

  return `
    ${bar('Каталог', true)}
    <div class="mobile-menu__body">
      ${chips(state.gender)}
      ${rows}
    </div>`;
}

function renderInto() {
  panel.innerHTML = state.level === 'menu' ? renderMenu() : renderCatalog();
}

function openMenu() {
  state.level = 'menu';
  renderInto();
  show();
}

function openCatalog(gender) {
  const switching = isOpen && state.level === 'catalog';
  state.level = 'catalog';
  state.gender = gender || state.gender;
  const category = menu.categories.find((c) => c.id === state.gender);
  if (!switching || !category.tabs.some((t) => t.id === state.expanded)) {
    state.expanded = null;
  }
  renderInto();
  show();
}

function show() {
  isOpen = true;
  panel.classList.add(CLASS_OPEN);
  panel.setAttribute('aria-hidden', 'false');
  setBurgerExpanded(true);
  document.body.style.overflow = 'hidden';
  trap.activate();
}

function close() {
  isOpen = false;
  panel.classList.remove(CLASS_OPEN);
  panel.setAttribute('aria-hidden', 'true');
  setBurgerExpanded(false);
  document.body.style.overflow = '';
  trap.release();
}

function onClick(event) {
  if (event.target.closest('[data-burger]')) {
    openMenu();
    return;
  }

  const genderBtn = event.target.closest('[data-open-catalog][data-gender]');
  if (genderBtn) {
    openCatalog(genderBtn.dataset.gender);
    return;
  }

  if (!isOpen) return;

  if (event.target.closest('[data-close]')) return close();
  if (event.target.closest('[data-back]')) return openMenu();
  if (event.target.closest('[data-open-catalog]')) return openCatalog(state.gender);

  const acc = event.target.closest('[data-acc]');
  if (acc) {
    state.expanded = state.expanded === acc.dataset.acc ? null : acc.dataset.acc;
    renderInto();
  }
}

function onKeydown(event) {
  if (event.key === 'Escape' && isOpen) close();
}

export async function initMobileMenu() {
  panel = document.querySelector('[data-mobile-menu]');
  if (!panel) return;

  trap = createFocusTrap(panel);
  menu = await mockApi.getMenu();

  document.addEventListener('click', onClick);
  document.addEventListener('keydown', onKeydown);
}
