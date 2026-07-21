import { createCenteredModal } from './centeredModal.js';
import authStore from './authStore.js';
import { LAYERS } from '../constants.js';

const content = () => {
  const authed = authStore.isAuthed();
  const text = authed
    ? 'Для отслеживания статуса заказа перейдите в личный кабинет в раздел «Мои заказы»'
    : 'Мы свяжемся с вами для подтверждения заказа';
  const action = authed
    ? '<a class="btn btn--filled btn--cta modal__btn" href="/account">Перейти</a>'
    : '<a class="btn btn--filled btn--cta modal__btn" href="/catalog">В каталог</a>';
  return `
  <button class="modal__close" type="button" data-modal-close aria-label="Закрыть">
    <svg class="icon" aria-hidden="true"><use href="#icon-close"></use></svg>
  </button>
  <h2 class="modal__title">Ваш заказ оформлен</h2>
  <p class="modal__text">${text}</p>
  <div class="modal__actions">${action}</div>`;
};

const modal = createCenteredModal({
  label: 'Заказ оформлен',
  layer: LAYERS.orderSuccess,
  content,
});

export const initOrderSuccess = modal.init;
export const openOrderSuccess = modal.open;
