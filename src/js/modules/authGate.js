import { createCenteredModal } from './centeredModal.js';
import { openAuth } from './auth.js';
import { EVENTS, LAYERS } from '../constants.js';

const content = () => `
  <button class="modal__close" type="button" data-modal-close aria-label="Закрыть">
    <svg class="icon" aria-hidden="true"><use href="#icon-close"></use></svg>
  </button>
  <h2 class="modal__title">Больше выгоды</h2>
  <p class="modal__text">Зарегистрированным и авторизованным покупателям удобно следить за их заказами, а также у них есть доступ к персональным промокодам</p>
  <div class="modal__actions">
    <button class="btn btn--filled btn--cta modal__btn" type="button" data-auth-login>Войти / Зарегистрироваться</button>
    <button class="btn btn--primary btn--ghost-dark btn--cta modal__btn" type="button" data-auth-guest>
      <span>Оформить как гость</span>
      <svg class="icon btn__icon" aria-hidden="true"><use href="#icon-arrow-circle"></use></svg>
    </button>
  </div>`;

const modal = createCenteredModal({
  label: 'Оформление заказа',
  layer: LAYERS.orderGate,
  content,
  onAction(event, close) {
    if (event.target.closest('[data-auth-login]')) {
      close();
      openAuth('login', () => document.dispatchEvent(new CustomEvent(EVENTS.checkoutStart)));
      return;
    }
    if (event.target.closest('[data-auth-guest]')) {
      close();
      document.dispatchEvent(new CustomEvent(EVENTS.checkoutStart));
    }
  },
});

export const initAuthGate = modal.init;
export const openAuthGate = modal.open;
