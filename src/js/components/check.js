export function renderCheck({ label, attrs = '', modifier = '' }) {
  return `
    <label class="check${modifier}">
      <input class="check__input" type="checkbox" ${attrs} />
      <span class="check__box">
        <svg class="check__icon check__icon--off" aria-hidden="true"><use href="#icon-radio"></use></svg>
        <svg class="check__icon check__icon--on" aria-hidden="true"><use href="#icon-radio-checked"></use></svg>
      </span>
      <span class="check__label">${label}</span>
    </label>`;
}
