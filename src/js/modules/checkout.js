import mockApi from '../api/mockApi.js';
import IMask from 'imask';
import { renderCheck } from '../components/check.js';
import { openAddressDrawer, openBranchesDrawer, isDrawerOpen } from './checkoutDrawer.js';
import { renderOrderSummary, subscribeSummary } from './orderSummary.js';
import { createFocusTrap } from '../utils/focusTrap.js';
import { BASE } from '../utils/base.js';
import { EVENTS } from '../constants.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let panel = null;
let trap = null;
let isOpen = false;
let data = null;
let phoneMask = null;
const state = { delivery: null, payment: null, date: null, time: null, branch: 0 };

const stepHeading = (num, title) => `
  <div class="checkout-form__step">
    <span class="checkout-form__num">${num}.</span>
    <h2 class="checkout-form__step-title">${title}</h2>
  </div>`;

const field = (input) => `
  <label class="checkout-form__field">
    ${input}
    <span class="checkout-form__error" data-error></span>
  </label>`;

function contactSection() {
  return `
    <section class="checkout-form__section">
      ${stepHeading('01', 'Контактные данные')}
      <div class="checkout-form__grid">
        ${field('<input class="checkout-form__input" type="text" placeholder="Имя" data-name="firstName" data-required autocomplete="given-name" />')}
        ${field('<input class="checkout-form__input" type="text" placeholder="Фамилия" data-name="lastName" data-required autocomplete="family-name" />')}
        ${field('<input class="checkout-form__input" type="tel" placeholder="+7 000 000 00 00" data-name="phone" data-required autocomplete="tel" />')}
        ${field('<input class="checkout-form__input" type="email" placeholder="Email" data-name="email" data-required autocomplete="email" />')}
      </div>
      ${renderCheck({
        modifier: ' check--top checkout-form__consent',
        attrs: 'data-checkout-consent data-required',
        label: `Я даю <a class="checkout-form__link" href="${BASE}privacy" target="_blank" rel="noopener">согласие</a> на обработку своих персональных данных в соответствии с <a class="checkout-form__link" href="${BASE}privacy" target="_blank" rel="noopener">политикой обработки персональных данных</a>`,
      })}
    </section>`;
}

const methodCard = (m) => `
  <button class="checkout-card" type="button" data-delivery="${m.id}">
    <svg class="icon checkout-card__icon" aria-hidden="true"><use href="#${m.icon}"></use></svg>
    <span class="checkout-card__text">
      <span class="checkout-card__title">${m.title}</span>
      <span class="checkout-card__desc">${m.desc}</span>
    </span>
  </button>`;

const editButton = (target) => `
  <button class="btn btn--primary checkout-form__edit" type="button" data-checkout-edit="${target}">
    <span>Изменить</span>
    <svg class="icon btn__icon" aria-hidden="true"><use href="#icon-arrow-circle"></use></svg>
  </button>`;

function deliveryExtra() {
  return `
    <div class="checkout-form__extra" data-extra="delivery" hidden>
      <div class="checkout-form__row">
        <p class="checkout-form__note"><b>Адрес доставки:</b> <span data-checkout-address>${data.address}</span></p>
        ${editButton('address')}
      </div>
      <p class="checkout-form__label">Выберите дату и время:</p>
      <div class="checkout-form__dates">
        ${data.dates.map((d) => `
          <button class="checkout-chip checkout-chip--date" type="button" data-date="${d.id}">
            <span class="checkout-chip__day">${d.day}</span>
            <span class="checkout-chip__weekday">${d.weekday}</span>
          </button>`).join('')}
      </div>
      <div class="checkout-form__times">
        ${data.times.map((t, i) => `<button class="checkout-chip" type="button" data-time="${i}">${t}</button>`).join('')}
      </div>
      <p class="checkout-form__hint" data-error-datetime hidden>Выберите дату и время доставки</p>
    </div>`;
}

function pickupExtra() {
  const branch = data.branches[state.branch];
  return `
    <div class="checkout-form__extra" data-extra="pickup" hidden>
      <div class="checkout-form__row">
        <p class="checkout-form__note"><b>Из магазина <span data-checkout-store-name>${branch.name}</span>:</b> <span data-checkout-store>г. Красноярск, ${branch.address}</span></p>
        ${editButton('branch')}
      </div>
      <div class="checkout-form__reserve">
        <p>Можно забрать <b class="checkout-form__accent" data-checkout-pickup>с ${branch.pickup}</b></p>
        <p>Резерв товара — <b>${data.reserveDays} дня</b></p>
      </div>
    </div>`;
}

const paymentCard = (p) => `
  <button class="checkout-card checkout-card--payment" type="button" data-payment="${p.id}"${p.id === 'cash' && state.delivery !== 'pickup' ? ' hidden' : ''}>
    <svg class="icon checkout-card__icon" aria-hidden="true"><use href="#${p.icon}"></use></svg>
    <span class="checkout-card__title">${p.title}</span>
  </button>`;

function content() {
  return `
    <div class="checkout__head">
      <button class="checkout__back" type="button" data-checkout-back aria-label="Назад">
        <svg class="icon icon--flip" aria-hidden="true"><use href="#icon-arrow-right"></use></svg>
      </button>
      <h2 class="checkout__title">Оформление заказа</h2>
    </div>
    <div class="checkout__body">
      <form class="checkout-form" novalidate>
        ${contactSection()}
        <section class="checkout-form__section">
          ${stepHeading('02', 'Способ получения заказа')}
          <div class="checkout-form__methods">${data.deliveryMethods.map(methodCard).join('')}</div>
          <p class="checkout-form__hint" data-error-delivery hidden>Выберите способ получения заказа</p>
          ${deliveryExtra()}
          ${pickupExtra()}
        </section>
        <section class="checkout-form__section">
          ${stepHeading('03', 'Способ оплаты')}
          <div class="checkout-form__methods checkout-form__methods--payment">${data.paymentMethods.map(paymentCard).join('')}</div>
          <p class="checkout-form__hint" data-error-payment hidden>Выберите способ оплаты</p>
        </section>
        <div class="checkout-form__summary" data-checkout-summary>${renderOrderSummary()}</div>
      </form>
    </div>`;
}

function setChoiceError(attr, hidden) {
  const error = panel.querySelector(`[data-error-${attr}]`);
  if (error) error.hidden = hidden;
}

function selectDelivery(id) {
  state.delivery = id;
  panel.querySelectorAll('[data-delivery]').forEach((b) => b.classList.toggle('is-active', b.dataset.delivery === id));
  panel.querySelectorAll('[data-extra]').forEach((e) => {
    e.hidden = e.dataset.extra !== id;
  });
  const cash = panel.querySelector('[data-payment="cash"]');
  if (cash) {
    const cashAvailable = id === 'pickup';
    cash.hidden = !cashAvailable;
    if (!cashAvailable && state.payment === 'cash') {
      state.payment = null;
      cash.classList.remove('is-active');
    }
  }
  setChoiceError('delivery', true);
}

function selectPayment(id) {
  state.payment = id;
  panel.querySelectorAll('[data-payment]').forEach((b) => b.classList.toggle('is-active', b.dataset.payment === id));
  setChoiceError('payment', true);
}

function selectChip(attr, value) {
  state[attr] = attr === 'time' ? Number(value) : value;
  panel.querySelectorAll(`[data-${attr}]`).forEach((b) => b.classList.toggle('is-active', b.dataset[attr] === value));
  if (state.date && state.time !== null) setChoiceError('datetime', true);
}

function applyAddress(address) {
  state.address = address;
  const el = panel.querySelector('[data-checkout-address]');
  if (el) el.textContent = address;
}

function applyBranch(index) {
  state.branch = index;
  const branch = data.branches[index];
  const name = panel.querySelector('[data-checkout-store-name]');
  const store = panel.querySelector('[data-checkout-store]');
  const pickup = panel.querySelector('[data-checkout-pickup]');
  if (name) name.textContent = branch.name;
  if (store) store.textContent = `г. Красноярск, ${branch.address}`;
  if (pickup) pickup.textContent = `с ${branch.pickup}`;
}

function setError(input, message) {
  const wrap = input.closest('.checkout-form__field');
  if (!wrap) return;
  wrap.classList.toggle('is-invalid', Boolean(message));
  const error = wrap.querySelector('[data-error]');
  if (error) error.textContent = message;
}

function validateField(input) {
  const value = input.value.trim();
  let message = '';
  if (input.hasAttribute('data-required') && !value) message = 'Заполните поле';
  else if (input.dataset.name === 'email' && !EMAIL_RE.test(value)) message = 'Введите корректный email';
  else if (input.dataset.name === 'phone' && phoneMask && !phoneMask.masked.isComplete) message = 'Введите номер целиком';
  setError(input, message);
  return !message;
}

function validateConsent() {
  const consent = panel.querySelector('[data-checkout-consent]');
  const ok = consent.checked;
  consent.closest('.check').classList.toggle('is-invalid', !ok);
  return ok;
}

function validateChoice(attr) {
  const ok = Boolean(state[attr]);
  setChoiceError(attr, ok);
  return ok;
}

function validateDateTime() {
  const ok = Boolean(state.date) && state.time !== null;
  setChoiceError('datetime', ok);
  return ok;
}

function validateAll() {
  let valid = true;
  panel.querySelectorAll('[data-name]').forEach((input) => {
    if (!validateField(input)) valid = false;
  });
  if (!validateConsent()) valid = false;
  if (!validateChoice('delivery')) valid = false;
  else if (state.delivery === 'delivery' && !validateDateTime()) valid = false;
  if (!validateChoice('payment')) valid = false;
  return valid;
}

export function submitCheckout() {
  if (!validateAll()) {
    panel.querySelector('.is-invalid')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    return false;
  }
  const contact = {};
  panel.querySelectorAll('[data-name]').forEach((input) => {
    contact[input.dataset.name] = input.value.trim();
  });
  mockApi.placeOrder({
    contact,
    delivery: state.delivery,
    payment: state.payment,
    date: state.date,
    time: state.time,
    address: state.delivery === 'pickup' ? null : state.address,
    branch: state.delivery === 'pickup' ? data.branches[state.branch].id : null,
  });
  return true;
}

export function isCheckoutOpen() {
  return isOpen;
}

export function openCheckout() {
  if (isOpen) return;
  isOpen = true;
  panel.classList.add('is-open');
  panel.setAttribute('aria-hidden', 'false');
  trap.activate();
}

export function closeCheckout() {
  if (!isOpen) return;
  isOpen = false;
  panel.classList.remove('is-open');
  panel.setAttribute('aria-hidden', 'true');
  trap.release();
  document.dispatchEvent(new CustomEvent(EVENTS.checkoutClose));
}

function onClick(event) {
  if (!isOpen) return;
  if (event.target.closest('[data-checkout-back]')) return closeCheckout();

  const delivery = event.target.closest('[data-delivery]');
  if (delivery) return selectDelivery(delivery.dataset.delivery);

  const payment = event.target.closest('[data-payment]');
  if (payment) return selectPayment(payment.dataset.payment);

  const date = event.target.closest('[data-date]');
  if (date) return selectChip('date', date.dataset.date);

  const time = event.target.closest('[data-time]');
  if (time) return selectChip('time', time.dataset.time);

  const edit = event.target.closest('[data-checkout-edit]');
  if (edit) return edit.dataset.checkoutEdit === 'address' ? openAddressDrawer() : openBranchesDrawer();
}

function onKeydown(event) {
  if (event.key === 'Escape' && isOpen && !isDrawerOpen()) closeCheckout();
}

export function initCheckout() {
  panel = document.createElement('section');
  panel.className = 'checkout';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', 'Оформление заказа');
  panel.setAttribute('aria-hidden', 'true');
  data = mockApi.getCheckout();
  state.address = data.address;
  panel.innerHTML = content();
  document.body.appendChild(panel);

  trap = createFocusTrap(panel);
  phoneMask = IMask(panel.querySelector('[data-name="phone"]'), { mask: '+{7} (000) 000-00-00' });
  IMask(panel.querySelector('[data-name="email"]'), { mask: /^\S*@?\S*$/ });

  panel.addEventListener('focusout', (event) => {
    const input = event.target.closest('[data-name]');
    if (input) validateField(input);
  });
  panel.addEventListener('change', (event) => {
    if (event.target.closest('[data-checkout-consent]')) validateConsent();
  });

  subscribeSummary(() => {
    const summary = panel.querySelector('[data-checkout-summary]');
    if (summary) summary.innerHTML = renderOrderSummary();
  });

  document.addEventListener('click', onClick);
  document.addEventListener('keydown', onKeydown);
  document.addEventListener(EVENTS.checkoutAddress, (event) => applyAddress(event.detail));
  document.addEventListener(EVENTS.checkoutBranch, (event) => applyBranch(event.detail));
}
