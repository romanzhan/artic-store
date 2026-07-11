export function renderActions() {
  return `
    <div class="cta-actions">
      <button class="btn btn--filled btn--cta cta-actions__cart" type="button" data-add-cart>
        <span class="cta-actions__full">Добавить в корзину</span>
        <span class="cta-actions__short">В корзину</span>
      </button>
      <button class="btn btn--primary btn--ghost-dark btn--cta cta-actions__buy" type="button" data-buy-now>
        <span>Купить сейчас</span>
        <svg class="icon btn__icon" aria-hidden="true"><use href="#icon-arrow-circle"></use></svg>
      </button>
    </div>`;
}
