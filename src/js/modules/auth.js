import IMask from 'imask';
import authApi from '../api/authApi.js';
import authStore from './authStore.js';
import { renderCheck } from '../components/check.js';
import { createAssetResolver } from '../utils/assets.js';
import { createFocusTrap } from '../utils/focusTrap.js';
import { lockScroll, unlockScroll } from '../utils/scrollLock.js';
import { go, BASE } from '../utils/base.js';
import { escapeHtml } from '../utils/dom.js';
import { showOverlay, hideOverlay, setOverlayFront } from './overlay.js';
import { EVENTS, LAYERS } from '../constants.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_SECONDS = 30;

const photo = createAssetResolver(
  import.meta.glob('../../assets/images/auth/*.webp', { eager: true, query: '?url', import: 'default' }),
)('auth');

let panel = null;
let trap = null;
let isOpen = false;
let phoneMask = null;
let resendTimer = null;
let onAuthed = null;
const state = { view: 'login', flow: 'register', email: '' };

const config = {
  login: { title: 'Войти в профиль', back: false },
  register: { title: 'Регистрация', back: true },
  recovery: { title: 'Восстановление пароля', back: true },
  confirm: { title: 'Подтверждение', back: true },
  newPassword: { title: 'Новый пароль', back: false },
};

const field = (input) => `
  <label class="auth__field">
    ${input}
    <span class="auth__error" data-error></span>
  </label>`;

function headHtml() {
  const { title, back } = config[state.view];
  return `
    <div class="auth__heading">
      ${back ? '<button class="slider-nav slider-nav--prev auth__back" type="button" data-auth-back aria-label="Назад"><svg class="icon slider-nav__icon" aria-hidden="true"><use href="#icon-arrow-slider"></use></svg></button>' : ''}
      <h2 class="auth__title">${title}</h2>
    </div>
    <div class="auth__notice" data-notice hidden></div>`;
}

const views = {
  login: () => `
    <form class="auth__form" data-auth-form="login" novalidate>
      ${field('<input class="auth__input" type="email" placeholder="Email" data-name="email" autocomplete="email" />')}
      ${field('<input class="auth__input" type="password" placeholder="Пароль" data-name="password" autocomplete="current-password" />')}
      <button class="auth__link auth__forgot" type="button" data-auth-view="recovery">Забыли пароль?</button>
      <div class="auth__actions">
        <button class="btn btn--filled auth__submit" type="submit">Войти</button>
        <button class="btn btn--primary btn--ghost-dark auth__submit" type="button" data-auth-view="register">
          <span>Зарегистрироваться</span>
          <svg class="icon btn__icon" aria-hidden="true"><use href="#icon-arrow-circle"></use></svg>
        </button>
      </div>
    </form>`,

  register: () => `
    <form class="auth__form" data-auth-form="register" novalidate>
      ${field('<input class="auth__input" type="email" placeholder="Email" data-name="email" autocomplete="email" />')}
      ${field('<input class="auth__input" type="tel" placeholder="Телефон" data-name="phone" autocomplete="tel" />')}
      ${field('<input class="auth__input" type="text" placeholder="Фамилия" data-name="lastName" autocomplete="family-name" />')}
      ${field('<input class="auth__input" type="text" placeholder="Имя" data-name="firstName" autocomplete="given-name" />')}
      ${field('<input class="auth__input" type="password" placeholder="Пароль" data-name="password" autocomplete="new-password" />')}
      ${renderCheck({ modifier: ' check--top auth__consent', attrs: 'data-auth-consent', label: `Я даю <a class="auth__link" href="${BASE}privacy" target="_blank" rel="noopener">согласие</a> на обработку своих персональных данных в соответствии с <a class="auth__link" href="${BASE}privacy" target="_blank" rel="noopener">политикой обработки персональных данных</a>` })}
      <div class="auth__actions">
        <button class="btn btn--filled auth__submit" type="submit">Зарегистрироваться</button>
      </div>
    </form>`,

  recovery: () => `
    <form class="auth__form" data-auth-form="recovery" novalidate>
      <p class="auth__text">На вашу электронную почту мы отправим ссылку для восстановления пароля. Если письмо не пришло, посмотрите в папке «Спам». Либо попробуйте восстановить пароль заново.</p>
      ${field('<input class="auth__input" type="email" placeholder="Email" data-name="email" autocomplete="email" />')}
      <div class="auth__actions">
        <button class="btn btn--filled auth__submit" type="submit">Отправить</button>
      </div>
    </form>`,

  confirm: () => `
    <form class="auth__form" data-auth-form="confirm" novalidate>
      <p class="auth__text">Мы выслали Вам код подтверждения на почту <b>${escapeHtml(state.email)}</b>. Введите его в поле ниже:</p>
      ${field('<input class="auth__input" type="text" inputmode="numeric" placeholder="Код из письма" data-name="code" autocomplete="one-time-code" />')}
      <button class="auth__link auth__resend" type="button" data-auth-resend>Запросить код повторно</button>
      <div class="auth__actions">
        <button class="btn btn--filled auth__submit" type="submit">Отправить</button>
      </div>
    </form>`,

  newPassword: () => `
    <form class="auth__form" data-auth-form="newPassword" novalidate>
      <p class="auth__text">Придумайте новый пароль</p>
      ${field('<input class="auth__input" type="password" placeholder="Пароль" data-name="password" autocomplete="new-password" />')}
      ${field('<input class="auth__input" type="password" placeholder="Повторите пароль" data-name="repeat" autocomplete="new-password" />')}
      <div class="auth__actions">
        <button class="btn btn--filled auth__submit" type="submit">Изменить</button>
      </div>
    </form>`,
};

function setError(input, message) {
  const wrap = input.closest('.auth__field');
  if (!wrap) return;
  wrap.classList.toggle('is-invalid', Boolean(message));
  const error = wrap.querySelector('[data-error]');
  if (error) error.textContent = message;
}

function setNotice(message, type = 'error') {
  const el = panel.querySelector('[data-notice]');
  if (!el) return;
  el.textContent = message || '';
  el.classList.toggle('auth__notice--success', type === 'success');
  el.classList.toggle('auth__notice--error', type !== 'success');
  el.hidden = !message;
}

function fieldValue(name) {
  return panel.querySelector(`[data-name="${name}"]`)?.value.trim() ?? '';
}

function validate(rules) {
  let valid = true;
  for (const [name, rule] of Object.entries(rules)) {
    const input = panel.querySelector(`[data-name="${name}"]`);
    if (!input) continue;
    const message = rule(input.value.trim());
    setError(input, message);
    if (message) valid = false;
  }
  return valid;
}

const required = (value) => (value ? '' : 'Заполните поле');
const emailRule = (value) => (!value ? 'Заполните поле' : EMAIL_RE.test(value) ? '' : 'Введите корректный email');

function stopTimer() {
  if (resendTimer) clearInterval(resendTimer);
  resendTimer = null;
}

function startTimer() {
  stopTimer();
  const button = panel.querySelector('[data-auth-resend]');
  if (!button) return;
  let left = RESEND_SECONDS;
  const tick = () => {
    if (left <= 0) {
      stopTimer();
      button.disabled = false;
      button.textContent = 'Запросить код повторно';
      return;
    }
    button.disabled = true;
    button.textContent = `Запросить код повторно — 0:${String(left).padStart(2, '0')}`;
    left -= 1;
  };
  tick();
  resendTimer = setInterval(tick, 1000);
}

function renderPanel() {
  stopTimer();
  panel.querySelector('.auth__panel').innerHTML = headHtml() + views[state.view]();
  if (state.view === 'register') {
    phoneMask = IMask(panel.querySelector('[data-name="phone"]'), { mask: '+{7} (000) 000-00-00' });
  } else {
    phoneMask = null;
  }
  if (state.view === 'confirm') startTimer();
  panel.querySelector('.auth__input')?.focus();
}

function setView(view) {
  state.view = view;
  renderPanel();
}

async function withSubmit(button, action) {
  setNotice('');
  button.disabled = true;
  try {
    await action();
  } catch (error) {
    if (error.field) setError(panel.querySelector(`[data-name="${error.field}"]`), error.message);
    else setNotice(error.message || 'Что-то пошло не так');
  } finally {
    button.disabled = false;
  }
}

function finishAuth(user) {
  authStore.set(user);
  const next = onAuthed;
  if (next) {
    close();
    next();
  } else {
    go('/account');
  }
}

async function onSubmit(event) {
  const form = event.target;
  if (!form.matches?.('[data-auth-form]')) return;
  event.preventDefault();
  const button = form.querySelector('[type="submit"]');

  if (form.dataset.authForm === 'login') {
    if (!validate({ email: emailRule, password: required })) return;
    await withSubmit(button, async () => {
      const user = await authApi.login({ email: fieldValue('email'), password: fieldValue('password') });
      finishAuth(user);
    });
  } else if (form.dataset.authForm === 'register') {
    const consent = panel.querySelector('[data-auth-consent]');
    consent.closest('.check').classList.toggle('is-invalid', !consent.checked);
    const ok = validate({ email: emailRule, phone: required, lastName: required, firstName: required, password: required });
    if (!ok || !consent.checked) return;
    await withSubmit(button, async () => {
      await authApi.register({
        email: fieldValue('email'),
        phone: fieldValue('phone'),
        lastName: fieldValue('lastName'),
        firstName: fieldValue('firstName'),
        password: fieldValue('password'),
      });
      state.email = fieldValue('email');
      state.flow = 'register';
      setView('confirm');
    });
  } else if (form.dataset.authForm === 'recovery') {
    if (!validate({ email: emailRule })) return;
    await withSubmit(button, async () => {
      state.email = fieldValue('email');
      state.flow = 'recovery';
      await authApi.forgotPassword({ email: state.email });
      setView('confirm');
    });
  } else if (form.dataset.authForm === 'confirm') {
    if (!validate({ code: required })) return;
    await withSubmit(button, async () => {
      const user = await authApi.verify({ email: state.email, code: fieldValue('code') });
      if (state.flow === 'recovery') {
        setView('newPassword');
      } else {
        finishAuth(user);
      }
    });
  } else if (form.dataset.authForm === 'newPassword') {
    if (!validate({ password: required, repeat: required })) return;
    if (fieldValue('password') !== fieldValue('repeat')) {
      setError(panel.querySelector('[data-name="repeat"]'), 'Пароли не совпадают');
      return;
    }
    await withSubmit(button, async () => {
      await authApi.resetPassword({ email: state.email, password: fieldValue('password') });
      setView('login');
      setNotice('Пароль изменён, войдите снова', 'success');
    });
  }
}

export function openAuth(view = 'login', after = null) {
  onAuthed = after;
  if (isOpen) {
    setView(view);
    return;
  }
  isOpen = true;
  state.view = view;
  renderPanel();
  panel.classList.add('is-open');
  panel.setAttribute('aria-hidden', 'false');
  document.querySelectorAll('[data-account][aria-haspopup]').forEach((el) => el.setAttribute('aria-expanded', 'true'));
  lockScroll();
  showOverlay();
  setOverlayFront(true);
  document.dispatchEvent(new CustomEvent(EVENTS.layerOpen, { detail: LAYERS.auth }));
  trap.activate();
}

function close() {
  if (!isOpen) return;
  isOpen = false;
  onAuthed = null;
  stopTimer();
  panel.classList.remove('is-open');
  panel.setAttribute('aria-hidden', 'true');
  document.querySelectorAll('[data-account][aria-haspopup]').forEach((el) => el.setAttribute('aria-expanded', 'false'));
  unlockScroll();
  setOverlayFront(false);
  hideOverlay();
  trap.release();
}

function onClick(event) {
  if (event.target.closest('[data-account]')) {
    event.preventDefault();
    if (authStore.isAuthed()) go('/account');
    else openAuth('login');
    return;
  }
  if (!isOpen) return;
  if (event.target.closest('[data-auth-close]')) return close();
  if (event.target.closest('[data-auth-back]')) return setView(state.view === 'confirm' ? state.flow : 'login');
  const view = event.target.closest('[data-auth-view]');
  if (view) return setView(view.dataset.authView);
  const resend = event.target.closest('[data-auth-resend]');
  if (resend && !resend.disabled) {
    authApi.forgotPassword({ email: state.email });
    startTimer();
  }
}

function onKeydown(event) {
  if (event.key === 'Escape' && isOpen) close();
}

export function initAuth() {
  panel = document.createElement('div');
  panel.className = 'auth';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', 'Авторизация');
  panel.setAttribute('aria-hidden', 'true');
  panel.innerHTML = `
    <div class="auth__media"><img src="${photo}" alt="" /></div>
    <button class="auth__close" type="button" data-auth-close aria-label="Закрыть"><svg class="icon" aria-hidden="true"><use href="#icon-close"></use></svg></button>
    <div class="auth__panel"></div>`;
  document.body.appendChild(panel);

  trap = createFocusTrap(panel);

  document.addEventListener('click', onClick);
  document.addEventListener('submit', onSubmit);
  document.addEventListener('keydown', onKeydown);
  document.addEventListener(EVENTS.overlayClick, close);
  document.addEventListener(EVENTS.layerOpen, (event) => {
    if (event.detail !== LAYERS.auth) close();
  });

  const syncHeader = () => {
    const authed = authStore.isAuthed();
    document.querySelectorAll('[data-account]').forEach((el) => {
      el.classList.toggle('is-active', authed);
      if (authed) {
        el.removeAttribute('aria-haspopup');
        el.removeAttribute('aria-expanded');
      } else {
        el.setAttribute('aria-haspopup', 'dialog');
        el.setAttribute('aria-expanded', String(isOpen));
      }
    });
  };
  authStore.subscribe(syncHeader);
  syncHeader();
}
