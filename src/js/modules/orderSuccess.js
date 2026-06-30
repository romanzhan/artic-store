import { createCenteredModal } from './centeredModal.js';
import { LAYERS } from '../constants.js';

const content = () => `
  <button class="modal__close" type="button" data-modal-close aria-label="Закрыть">
    <svg class="icon" aria-hidden="true"><use href="#icon-close"></use></svg>
  </button>
  <h2 class="modal__title">Ваш заказ оформлен</h2>
  <p class="modal__text">Для отслеживания статуса заказа перейдите в личный кабинет в раздел «Мои заказы»</p>
  <div class="modal__actions">
    <a class="btn btn--filled modal__btn" href="/account">Перейти</a>
  </div>`;

const modal = createCenteredModal({
  label: 'Заказ оформлен',
  layer: LAYERS.orderSuccess,
  content,
});

export const initOrderSuccess = modal.init;
export const openOrderSuccess = modal.open;
