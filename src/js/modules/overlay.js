import { EVENTS } from '../constants.js';

const CLASS_VISIBLE = 'is-visible';
let el = null;
let count = 0;

export function initOverlay() {
  el = document.querySelector('[data-overlay]');
  if (!el) return;
  el.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent(EVENTS.overlayClick));
  });
}

export function showOverlay() {
  if (!el) return;
  count += 1;
  el.classList.add(CLASS_VISIBLE);
}

export function hideOverlay() {
  if (!el) return;
  count = Math.max(0, count - 1);
  if (count === 0) el.classList.remove(CLASS_VISIBLE);
}
