import mockApi from '../api/mockApi.js';
import cartStore from './cartStore.js';
import { formatPrice } from '../utils/productAssets.js';

let promo = null;
let promoError = false;
let buyNow = null;
const listeners = new Set();

function notify() {
  for (const fn of listeners) fn();
}

function resetPromo() {
  promo = null;
  promoError = false;
}

cartStore.subscribe(() => {
  if (!buyNow && !cartStore.lines().length) resetPromo();
  notify();
});

export function subscribeSummary(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setBuyNow(line) {
  buyNow = { ...line, qty: 1 };
  resetPromo();
  notify();
}

export function clearBuyNow() {
  if (!buyNow) return;
  buyNow = null;
  resetPromo();
  notify();
}

export function isBuyNow() {
  return Boolean(buyNow);
}

export function orderLines() {
  return buyNow ? [buyNow] : cartStore.lines();
}

export function orderCount() {
  return orderLines().reduce((total, line) => total + line.qty, 0);
}

function orderSubtotal() {
  return orderLines().reduce((sum, line) => sum + line.price * line.qty, 0);
}

export function orderSetQty(key, qty) {
  if (buyNow) {
    if (buyNow.key === key) {
      buyNow.qty = Math.max(1, qty);
      notify();
    }
    return;
  }
  cartStore.setQty(key, qty);
}

export function orderRemove(key) {
  if (buyNow) {
    if (buyNow.key === key) clearBuyNow();
    return;
  }
  cartStore.remove(key);
}

function discount(subtotal) {
  if (!promo) return 0;
  const value = promo.type === 'percent' ? Math.round((subtotal * promo.value) / 100) : promo.value;
  return Math.min(value, subtotal);
}

export function renderOrderSummary() {
  const subtotal = orderSubtotal();
  const off = discount(subtotal);
  const button = promo
    ? '<button class="btn btn--dark order-summary__promo-btn" type="button" data-promo-toggle>Отменить</button>'
    : `<button class="btn btn--primary order-summary__promo-btn" type="button" data-promo-toggle>
        <span>Применить</span>
        <svg class="icon btn__icon" aria-hidden="true"><use href="#icon-arrow-circle"></use></svg>
      </button>`;
  return `
    <div class="order-summary" data-order-summary>
      <div class="order-summary__promo">
        <div class="order-summary__promo-field">
          <input class="order-summary__promo-input" type="text" placeholder="Промокод" autocomplete="off" data-promo-input value="${promo ? promo.code : ''}"${promo ? ' readonly' : ''} />
          ${button}
        </div>
        ${promoError ? '<p class="order-summary__promo-error">Такого промокода нет</p>' : ''}
      </div>
      <div class="order-summary__rows">
        <div class="order-summary__row"><span>Сумма</span><span>${formatPrice(subtotal)}</span></div>
        ${off ? `<div class="order-summary__row order-summary__row--discount"><span>Скидка</span><span>−${formatPrice(off)}</span></div>` : ''}
        <div class="order-summary__row order-summary__row--total"><span>Итого</span><span>${formatPrice(subtotal - off)}</span></div>
      </div>
      <button class="btn btn--filled order-summary__submit" type="button" data-cart-checkout>Оформить заказ</button>
    </div>`;
}

export function initOrderSummary() {
  document.addEventListener('click', (event) => {
    const toggle = event.target.closest('[data-promo-toggle]');
    if (!toggle) return;
    if (promo) {
      promo = null;
      promoError = false;
    } else {
      const root = toggle.closest('[data-order-summary]');
      const value = root?.querySelector('[data-promo-input]')?.value ?? '';
      const found = mockApi.findPromo(value);
      promo = found;
      promoError = !found && value.trim().length > 0;
    }
    notify();
  });
}
