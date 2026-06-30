export const sliderNavButton = (dir, label, modifier = '') => `
  <button class="slider-nav slider-nav--${dir}${modifier ? ` ${modifier}` : ''}" type="button" aria-label="${label}" data-nav-${dir}>
    <svg class="icon slider-nav__icon" aria-hidden="true"><use href="#icon-arrow-slider"></use></svg>
  </button>`;
