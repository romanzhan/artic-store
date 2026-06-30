import cartStore from './cartStore.js';
import favoritesStore from './favoritesStore.js';
import { formatPrice, cartImageUrl } from '../utils/productAssets.js';
import { createFocusTrap } from '../utils/focusTrap.js';
import { hideCartToast } from './cartToast.js';
import { openAuthGate } from './authGate.js';
import authStore from './authStore.js';
import { openCheckout, closeCheckout, isCheckoutOpen, submitCheckout } from './checkout.js';
import { openOrderSuccess } from './orderSuccess.js';
import {
  renderOrderSummary,
  subscribeSummary,
  orderLines,
  orderCount,
  orderSetQty,
  orderRemove,
  isBuyNow,
  clearBuyNow,
} from './orderSummary.js';
import { lockScroll, unlockScroll } from '../utils/scrollLock.js';
import { showOverlay, hideOverlay, setOverlayFront } from './overlay.js';
import { escapeHtml } from '../utils/dom.js';
import { EVENTS, LAYERS } from '../constants.js';

let panel = null;
let trap = null;
let isOpen = false;
let confirmClear = false;

function resolveCartImage(image) {
  if (!image) return '';
  return image.startsWith('/') || image.startsWith('http') ? image : cartImageUrl(image);
}

function renderItem(line) {
  const isProduct = line.productId != null;
  const favActive = isProduct && favoritesStore.has(line.productId) ? ' is-active' : '';
  const price = line.oldPrice
    ? `<span class="cart-item__price-old">${formatPrice(line.oldPrice)}</span><span class="cart-item__price-new">${formatPrice(line.price)}</span>`
    : `<span class="cart-item__price-new">${formatPrice(line.price)}</span>`;
  const fav = isProduct
    ? `<button class="cart-item__fav${favActive}" type="button" data-fav aria-label="В избранное">
        <svg class="icon cart-item__heart cart-item__heart--outline" aria-hidden="true"><use href="#icon-favorite"></use></svg>
        <svg class="icon cart-item__heart cart-item__heart--fill" aria-hidden="true"><use href="#icon-heart"></use></svg>
      </button>`
    : '';

  return `
    <article class="cart-item"${isProduct ? ` data-product-id="${line.productId}"` : ''}>
      <a class="cart-item__media" href="${escapeHtml(line.href)}">
        <img class="cart-item__img" src="${resolveCartImage(line.image)}" alt="${escapeHtml(line.title)}" loading="lazy" />
      </a>
      <div class="cart-item__body">
        <div class="cart-item__head">
          <div class="cart-item__id">
            <span class="cart-item__brand">${escapeHtml(line.brand)}</span>
            <a class="cart-item__title" href="${escapeHtml(line.href)}">${escapeHtml(line.title)}</a>
            <span class="cart-item__meta">${escapeHtml(line.meta)}</span>
          </div>
          <div class="cart-item__tools">
            ${fav}
            <button class="cart-item__remove" type="button" data-cart-remove="${line.key}" aria-label="Удалить">
              <svg class="icon cart-item__remove-icon" aria-hidden="true"><use href="#icon-trash"></use></svg>
            </button>
          </div>
        </div>
        <div class="cart-item__foot">
          <div class="cart-item__qty">
            <button class="cart-item__step" type="button" data-cart-dec="${line.key}" aria-label="Уменьшить">
              <svg class="icon cart-item__step-icon" aria-hidden="true"><use href="#icon-qty-minus"></use></svg>
            </button>
            <span class="cart-item__count">${line.qty}</span>
            <button class="cart-item__step" type="button" data-cart-inc="${line.key}" aria-label="Увеличить">
              <svg class="icon cart-item__step-icon" aria-hidden="true"><use href="#icon-qty-plus"></use></svg>
            </button>
          </div>
          <div class="cart-item__price">${price}</div>
        </div>
      </div>
    </article>`;
}

function focusedStep() {
  const active = document.activeElement;
  if (!active || !panel.contains(active)) return null;
  if (active.dataset.cartInc) return `[data-cart-inc="${active.dataset.cartInc}"]`;
  if (active.dataset.cartDec) return `[data-cart-dec="${active.dataset.cartDec}"]`;
  return null;
}

function render() {
  const lines = orderLines();
  const count = orderCount();
  const restore = focusedStep();
  const body = lines.length
    ? `
      <div class="cart__items">${lines.map(renderItem).join('')}</div>
      <div class="cart__footer">${renderOrderSummary()}</div>`
    : `
      <div class="cart__empty">
        <p class="cart__empty-text">В корзине пока пусто</p>
        <a class="btn btn--primary" href="/catalog">
          <span>В каталог</span>
          <svg class="icon btn__icon" aria-hidden="true"><use href="#icon-arrow-circle"></use></svg>
        </a>
      </div>`;

  let clearBlock = '';
  if (lines.length && !isBuyNow()) {
    clearBlock = confirmClear
      ? `<div class="cart__clear-confirm">
          <span>Очистить?</span>
          <button class="cart__clear cart__clear--yes" type="button" data-cart-clear-yes>Да</button>
          <button class="cart__clear" type="button" data-cart-clear-no>Нет</button>
        </div>`
      : '<button class="cart__clear" type="button" data-cart-clear>Очистить</button>';
  }

  panel.innerHTML = `
    <div class="cart__head">
      <h2 class="cart__title">Корзина${count ? ` / ${count} шт` : ''}</h2>
      ${clearBlock}
      <button class="cart__close" type="button" data-cart-close aria-label="Закрыть">
        <svg class="icon" aria-hidden="true"><use href="#icon-close"></use></svg>
      </button>
    </div>
    ${body}`;

  updateCount();
  if (restore) panel.querySelector(restore)?.focus();
}

function updateCount(count = cartStore.count()) {
  document.querySelectorAll('[data-cart-count]').forEach((el) => {
    el.textContent = count > 0 ? String(count) : '';
  });
}

function open() {
  if (isOpen) return;
  isOpen = true;
  confirmClear = false;
  hideCartToast();
  render();
  panel.classList.add('is-open');
  panel.setAttribute('aria-hidden', 'false');
  document.querySelectorAll('[data-cart-open]').forEach((el) => el.setAttribute('aria-expanded', 'true'));
  lockScroll();
  showOverlay();
  setOverlayFront(true);
  document.dispatchEvent(new CustomEvent(EVENTS.layerOpen, { detail: LAYERS.cart }));
  trap.activate();
}

function close() {
  if (!isOpen) return;
  isOpen = false;
  if (isCheckoutOpen()) closeCheckout();
  clearBuyNow();
  panel.classList.remove('is-open');
  panel.setAttribute('aria-hidden', 'true');
  document.querySelectorAll('[data-cart-open]').forEach((el) => el.setAttribute('aria-expanded', 'false'));
  unlockScroll();
  setOverlayFront(false);
  hideOverlay();
  trap.release();
}

function enterCheckout() {
  trap.release();
  openCheckout();
}

function placeOrder() {
  const buyNowOrder = isBuyNow();
  close();
  if (!buyNowOrder) cartStore.clear();
  openOrderSuccess();
}

function step(key, delta) {
  const line = orderLines().find((item) => item.key === key);
  if (line) orderSetQty(key, line.qty + delta);
}

function onClick(event) {
  if (event.target.closest('[data-cart-open]')) {
    event.preventDefault();
    open();
    return;
  }
  if (!isOpen) return;

  if (event.target.closest('[data-cart-close]')) return close();
  if (event.target.closest('[data-cart-clear]')) {
    confirmClear = true;
    render();
    return;
  }
  if (event.target.closest('[data-cart-clear-yes]')) {
    confirmClear = false;
    cartStore.clear();
    return;
  }
  if (event.target.closest('[data-cart-clear-no]')) {
    confirmClear = false;
    render();
    return;
  }

  const remove = event.target.closest('[data-cart-remove]');
  if (remove) return orderRemove(remove.dataset.cartRemove);

  const inc = event.target.closest('[data-cart-inc]');
  if (inc) return step(inc.dataset.cartInc, 1);

  const dec = event.target.closest('[data-cart-dec]');
  if (dec) return step(dec.dataset.cartDec, -1);

  if (event.target.closest('[data-cart-checkout]')) {
    if (isCheckoutOpen()) {
      if (submitCheckout()) placeOrder();
      return;
    }
    if (authStore.isAuthed()) {
      enterCheckout();
    } else {
      close();
      openAuthGate();
    }
  }
}

function onKeydown(event) {
  if (event.key === 'Escape' && isOpen && !isCheckoutOpen()) close();
}

export function initCart() {
  panel = document.createElement('aside');
  panel.className = 'cart';
  panel.setAttribute('data-cart-drawer', '');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', 'Корзина');
  panel.setAttribute('aria-hidden', 'true');
  document.body.appendChild(panel);

  trap = createFocusTrap(panel);
  render();
  subscribeSummary(render);

  document.addEventListener('click', onClick);
  document.addEventListener('keydown', onKeydown);
  document.addEventListener(EVENTS.overlayClick, close);
  document.addEventListener(EVENTS.layerOpen, (event) => {
    if (event.detail !== LAYERS.cart) close();
  });
  document.addEventListener(EVENTS.checkoutStart, () => {
    open();
    enterCheckout();
  });
  document.addEventListener(EVENTS.checkoutClose, () => {
    if (isOpen) trap.activate();
  });
}
