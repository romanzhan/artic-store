import mockApi from '../api/mockApi.js';
import { renderCheck } from '../components/check.js';
import { createAssetResolver } from '../utils/assets.js';
import { createFocusTrap } from '../utils/focusTrap.js';
import { escapeHtml } from '../utils/dom.js';
import { EVENTS } from '../constants.js';

const imageUrl = createAssetResolver(
  import.meta.glob('../../assets/images/branches/*.webp', { eager: true, query: '?url', import: 'default' }),
);

let backdrop = null;
let panel = null;
let trap = null;
let isOpen = false;
let data = null;
let activeBranch = 0;

function addressContent() {
  return `
    <div class="side-drawer__head">
      <h2 class="side-drawer__title" id="side-drawer-title">Адрес доставки</h2>
      <button class="side-drawer__close" type="button" data-drawer-close aria-label="Закрыть">
        <svg class="icon" aria-hidden="true"><use href="#icon-close"></use></svg>
      </button>
    </div>
    <div class="side-drawer__body">
      <div class="address-field">
        <input class="checkout-form__input" type="text" placeholder="Город, улица, дом" autocomplete="off" data-address-input />
        <ul class="address-field__suggest" data-address-suggest hidden></ul>
      </div>
      ${renderCheck({ attrs: 'data-address-private', label: 'У меня частный дом' })}
      <div class="address-grid" data-address-extra>
        <input class="checkout-form__input" type="text" placeholder="Квартира" data-address-apt />
        <input class="checkout-form__input" type="text" placeholder="Подъезд" />
        <input class="checkout-form__input" type="text" placeholder="Этаж" />
      </div>
    </div>
    <div class="side-drawer__footer">
      <button class="btn btn--filled side-drawer__submit" type="button" data-address-submit>Привезти сюда</button>
    </div>`;
}

const branchCard = (b, i) => `
  <button class="branch-card${i === activeBranch ? ' is-active' : ''}" type="button" data-branch="${i}">
    <span class="branch-card__info">
      <span class="branch-card__name">${escapeHtml(b.name)}</span>
      <span class="branch-card__addr">${escapeHtml(b.address)}<br />${escapeHtml(b.hours)}</span>
      <span class="branch-card__pickup">Можно забрать <b>с ${escapeHtml(b.pickup)}</b></span>
    </span>
    <span class="branch-card__media"><img src="${imageUrl(b.image)}" alt="${escapeHtml(b.name)}" loading="lazy" /></span>
  </button>`;

function branchesContent() {
  return `
    <div class="side-drawer__head">
      <h2 class="side-drawer__title" id="side-drawer-title">Филиалы</h2>
      <button class="side-drawer__close" type="button" data-drawer-close aria-label="Закрыть">
        <svg class="icon" aria-hidden="true"><use href="#icon-close"></use></svg>
      </button>
    </div>
    <div class="side-drawer__body">
      <div class="branch-list">${data.branches.map(branchCard).join('')}</div>
    </div>
    <div class="side-drawer__footer">
      <button class="btn btn--filled side-drawer__submit" type="button" data-branch-submit>Забрать отсюда</button>
    </div>`;
}

function open(mode) {
  if (isOpen) return;
  isOpen = true;
  panel.innerHTML = mode === 'address' ? addressContent() : branchesContent();
  backdrop.classList.add('is-visible');
  panel.classList.add('is-open');
  panel.setAttribute('aria-hidden', 'false');
  trap.activate();
}

export const openAddressDrawer = () => open('address');
export const openBranchesDrawer = () => open('branches');
export const isDrawerOpen = () => isOpen;

function close() {
  if (!isOpen) return;
  isOpen = false;
  backdrop.classList.remove('is-visible');
  panel.classList.remove('is-open');
  panel.setAttribute('aria-hidden', 'true');
  trap.release();
}

function renderSuggest(input) {
  const suggest = panel.querySelector('[data-address-suggest]');
  const results = mockApi.searchAddress(input.value);
  if (!results.length) {
    suggest.hidden = true;
    suggest.innerHTML = '';
    return;
  }
  suggest.innerHTML = results
    .map((r) => `<li><button class="address-field__suggest-item" type="button" data-address-pick="${escapeHtml(r)}">${escapeHtml(r)}</button></li>`)
    .join('');
  suggest.hidden = false;
}

function onInput(event) {
  if (isOpen && event.target.closest('[data-address-input]')) renderSuggest(event.target);
}

function onChange(event) {
  const priv = event.target.closest('[data-address-private]');
  if (priv) {
    const extra = panel.querySelector('[data-address-extra]');
    if (extra) extra.hidden = priv.checked;
  }
}

function onClick(event) {
  if (!isOpen) return;
  if (event.target.closest('[data-drawer-close]')) return close();

  const pick = event.target.closest('[data-address-pick]');
  if (pick) {
    panel.querySelector('[data-address-input]').value = pick.dataset.addressPick;
    panel.querySelector('[data-address-suggest]').hidden = true;
    return;
  }

  const branch = event.target.closest('[data-branch]');
  if (branch) {
    activeBranch = Number(branch.dataset.branch);
    panel.querySelectorAll('[data-branch]').forEach((b) => b.classList.toggle('is-active', Number(b.dataset.branch) === activeBranch));
    return;
  }

  if (event.target.closest('[data-address-submit]')) {
    const street = panel.querySelector('[data-address-input]').value.trim();
    const apt = panel.querySelector('[data-address-apt]')?.value.trim();
    const address = street ? `${street}${apt ? `, кв. ${apt}` : ''}` : data.address;
    document.dispatchEvent(new CustomEvent(EVENTS.checkoutAddress, { detail: address }));
    return close();
  }

  if (event.target.closest('[data-branch-submit]')) {
    document.dispatchEvent(new CustomEvent(EVENTS.checkoutBranch, { detail: activeBranch }));
    return close();
  }
}

function onKeydown(event) {
  if (event.key === 'Escape' && isOpen) close();
}

export function initCheckoutDrawer() {
  data = mockApi.getCheckout();

  backdrop = document.createElement('div');
  backdrop.className = 'side-drawer__overlay';
  backdrop.addEventListener('click', close);

  panel = document.createElement('aside');
  panel.className = 'side-drawer';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-labelledby', 'side-drawer-title');
  panel.setAttribute('aria-hidden', 'true');

  document.body.append(backdrop, panel);
  trap = createFocusTrap(panel);

  document.addEventListener('click', onClick);
  document.addEventListener('input', onInput);
  document.addEventListener('change', onChange);
  document.addEventListener('keydown', onKeydown);
}
