const AUTO_HIDE = 4000;

let toastEl = null;
let hideTimer = null;
let exitTimer = null;

function ensureToast() {
  if (toastEl) return toastEl;
  toastEl = document.createElement('aside');
  toastEl.className = 'cart-toast';
  toastEl.setAttribute('role', 'status');
  toastEl.setAttribute('aria-live', 'polite');
  toastEl.hidden = true;
  toastEl.innerHTML = `
    <div class="cart-toast__head">
      <p class="cart-toast__title">Товар добавлен в корзину</p>
      <button class="cart-toast__close" type="button" data-cart-toast-close aria-label="Закрыть">
        <svg class="icon" aria-hidden="true"><use href="#icon-close"></use></svg>
      </button>
    </div>
    <div class="cart-toast__body">
      <div class="cart-toast__media"><img class="cart-toast__img" alt="" /></div>
      <div class="cart-toast__info">
        <span class="cart-toast__brand"></span>
        <span class="cart-toast__name"></span>
        <span class="cart-toast__meta"></span>
      </div>
    </div>`;
  document.body.appendChild(toastEl);
  toastEl.querySelector('[data-cart-toast-close]').addEventListener('click', hideCartToast);
  return toastEl;
}

export function showCartToast({ image, brand, title, size, color }) {
  const el = ensureToast();
  clearTimeout(hideTimer);
  clearTimeout(exitTimer);

  const img = el.querySelector('.cart-toast__img');
  img.src = image;
  img.alt = title;
  el.querySelector('.cart-toast__brand').textContent = brand;
  el.querySelector('.cart-toast__name').textContent = title;

  const meta = el.querySelector('.cart-toast__meta');
  meta.textContent = '';
  [size, color].filter(Boolean).forEach((part, i) => {
    if (i > 0) {
      const sep = document.createElement('span');
      sep.className = 'cart-toast__sep';
      sep.textContent = '|';
      meta.append(sep);
    }
    meta.append(String(part));
  });

  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('is-visible'));
  hideTimer = setTimeout(hideCartToast, AUTO_HIDE);
}

function exitDuration() {
  return (parseFloat(getComputedStyle(toastEl).transitionDuration) || 0) * 1000;
}

export function hideCartToast() {
  if (!toastEl || toastEl.hidden) return;
  clearTimeout(hideTimer);
  clearTimeout(exitTimer);
  toastEl.classList.remove('is-visible');
  exitTimer = setTimeout(() => {
    toastEl.hidden = true;
  }, exitDuration());
}
