import authApi from '../api/authApi.js';
import authStore from './authStore.js';
import favoritesStore from './favoritesStore.js';
import mockApi from '../api/mockApi.js';
import { renderProductCard } from '../components/productCard.js';
import { renderCheck } from '../components/check.js';
import { imageUrl, formatPrice } from '../utils/productAssets.js';
import { go, routePath, BASE } from '../utils/base.js';

const ORDER_STATUS = {
  created: { label: 'Создан', mod: 'created' },
  done: { label: 'Выполнен', mod: 'done' },
};

const SECTIONS = [
  { id: 'home', label: 'Главная', icon: 'icon-home', path: '/account' },
  { id: 'profile', label: 'Личные данные', icon: 'icon-account', path: '/account/profile' },
  { id: 'orders', label: 'Мои заказы', icon: 'icon-orders', path: '/account/orders' },
  { id: 'favorites', label: 'Избранное', icon: 'icon-favorite', path: '/account/favorites' },
];

let root = null;

function activeSection() {
  const segment = routePath().replace(/^\/account\/?/, '').split('/')[0];
  return SECTIONS.find((section) => section.id === segment)?.id ?? 'home';
}

function renderMenu(active) {
  const items = SECTIONS.map(
    (section) => `
      <a class="account__nav-item${section.id === active ? ' is-active' : ''}" href="${section.path}"${section.id === active ? ' aria-current="page"' : ''}>
        <svg class="icon account__nav-icon" aria-hidden="true"><use href="#${section.icon}"></use></svg>
        <span>${section.label}</span>
      </a>`,
  ).join('');

  return `
    <aside class="account__menu">
      <nav class="account__nav" aria-label="Разделы кабинета">${items}</nav>
      <button class="btn btn--primary btn--ghost-dark account__logout" type="button" data-account-logout>
        <span>Выйти из профиля</span>
        <svg class="icon btn__icon" aria-hidden="true"><use href="#icon-arrow-circle"></use></svg>
      </button>
    </aside>`;
}

function renderFavorites() {
  const items = mockApi.getFavorites();
  const body = items.length
    ? `<div class="account__grid">${items.map(renderProductCard).join('')}</div>`
    : `
      <div class="account__empty">
        <p class="account__empty-text">В избранном пока пусто</p>
        <a class="btn btn--primary" href="/catalog">
          <span>В каталог</span>
          <svg class="icon btn__icon" aria-hidden="true"><use href="#icon-arrow-circle"></use></svg>
        </a>
      </div>`;
  return `<div class="account__head">${mobileBack}<h1 class="account__title">Избранное</h1></div>${body}`;
}

const field = (input) => `<label class="account-form__field">${input}</label>`;

function renderProfile() {
  const user = authStore.user() ?? {};
  const gender = user.gender === 'male' ? 'male' : 'female';
  const value = (val) => (val ? ` value="${val}"` : '');

  return `
    <form class="account-form" data-account-profile novalidate>
      <section class="account-form__section">
        <div class="account-form__step">
          ${mobileBack}
          <span class="account-form__num">01.</span>
          <h2 class="account-form__step-title">Личные данные</h2>
        </div>
        <div class="account-form__gender-row">
          <span class="account-form__label">Ваш пол</span>
          <div class="account-form__gender">
            <button class="account-form__gender-btn${gender === 'female' ? ' is-active' : ''}" type="button" data-gender="female">Женский</button>
            <button class="account-form__gender-btn${gender === 'male' ? ' is-active' : ''}" type="button" data-gender="male">Мужской</button>
          </div>
        </div>
        <div class="account-form__grid">
          ${field(`<input class="account-form__input" type="text" placeholder="Имя" data-name="firstName" autocomplete="given-name"${value(user.firstName)} />`)}
          ${field(`<input class="account-form__input" type="text" placeholder="Фамилия" data-name="lastName" autocomplete="family-name"${value(user.lastName)} />`)}
          ${field(`<input class="account-form__input" type="tel" placeholder="+7 000 000 00 00" data-name="phone" autocomplete="tel"${value(user.phone)} />`)}
          ${field(`<input class="account-form__input" type="email" placeholder="Email" data-name="email" autocomplete="email"${value(user.email)} />`)}
        </div>
      </section>

      <section class="account-form__section">
        <div class="account-form__step">
          <span class="account-form__num">02.</span>
          <h2 class="account-form__step-title">Адрес доставки</h2>
        </div>
        ${field(`<input class="account-form__input" type="text" placeholder="Город, улица, дом" data-name="address" autocomplete="street-address"${value(user.address)} />`)}
        ${renderCheck({ modifier: ' account-form__check', attrs: `data-private-house${user.privateHouse ? ' checked' : ''}`, label: 'У меня частный дом' })}
        <div class="account-form__grid account-form__grid--three">
          ${field(`<input class="account-form__input" type="text" placeholder="Квартира" data-name="apartment"${value(user.apartment)} />`)}
          ${field(`<input class="account-form__input" type="text" placeholder="Подъезд" data-name="entrance"${value(user.entrance)} />`)}
          ${field(`<input class="account-form__input" type="text" placeholder="Этаж" data-name="floor"${value(user.floor)} />`)}
        </div>
        ${renderCheck({ modifier: ' account-form__check account-form__consent', attrs: 'data-consent', label: `Я даю <a class="account-form__link" href="${BASE}privacy" target="_blank" rel="noopener">согласие</a> на обработку своих персональных данных в соответствии с <a class="account-form__link" href="${BASE}privacy" target="_blank" rel="noopener">политикой обработки персональных данных</a>` })}
        <p class="account-form__success" data-profile-note role="status"></p>
        <button class="btn btn--filled account-form__submit" type="submit">Сохранить</button>
      </section>
    </form>`;
}

function orderId() {
  const parts = routePath().replace(/^\/account\/?/, '').split('/');
  return parts[0] === 'orders' && parts[1] ? Number(parts[1]) : null;
}

const statusBadge = (status) => `<span class="order-status order-status--${status.mod}">${status.label}</span>`;

function renderOrderCard(order) {
  const status = ORDER_STATUS[order.status] ?? ORDER_STATUS.created;
  const thumbs = order.items
    .map((item) => `<span class="order-card__thumb"><img src="${imageUrl(item.image)}" alt="" loading="lazy" /></span>`)
    .join('');
  return `
    <a class="order-card" href="/account/orders/${order.id}">
      <div class="order-card__main">
        <h2 class="order-card__num">Заказ № ${order.id}</h2>
        <p class="order-card__date">
          <svg class="icon order-card__icon" aria-hidden="true"><use href="#icon-date"></use></svg>
          ${order.date}
        </p>
        <p class="order-card__delivery"><b>${order.delivery}</b> ${order.address}</p>
        ${statusBadge(status)}
      </div>
      <div class="order-card__sum">
        <span class="order-card__sum-label">Сумма</span>
        <span class="order-card__sum-value">${formatPrice(order.total)}</span>
      </div>
      <div class="order-card__thumbs">${thumbs}</div>
    </a>`;
}

function renderOrders() {
  const orders = mockApi.getOrders();
  if (!orders.length) {
    return `
      <div class="account__head">${mobileBack}<h1 class="account__title">Мои заказы</h1></div>
      <div class="account__empty">
        <p class="account__empty-text">Заказов пока нет</p>
        <a class="btn btn--primary" href="/catalog">
          <span>В каталог</span>
          <svg class="icon btn__icon" aria-hidden="true"><use href="#icon-arrow-circle"></use></svg>
        </a>
      </div>`;
  }
  return `<div class="account__head">${mobileBack}<h1 class="account__title">Мои заказы</h1></div><div class="order-list">${orders.map(renderOrderCard).join('')}</div>`;
}

const sectionHead = (title, href) => `
  <div class="account-section__head">
    <h2 class="account-section__title">${title}</h2>
    <a class="account-section__link" href="${href}">
      <span>Посмотреть все</span>
      <svg class="icon" aria-hidden="true"><use href="#icon-arrow-circle"></use></svg>
    </a>
  </div>`;

const mobileBack = `
  <a class="account__back" href="/account" aria-label="Назад в личный кабинет">
    <svg class="icon icon--flip" aria-hidden="true"><use href="#icon-arrow-right"></use></svg>
  </a>`;

function renderHome() {
  const user = authStore.user() ?? {};
  const name = [user.lastName, user.firstName].filter(Boolean).join(' ') || user.email || 'Личный кабинет';
  const orders = mockApi.getOrders().slice(0, 2);
  const favorites = mockApi.getFavorites().slice(0, 3);
  const menu = SECTIONS.filter((section) => section.id !== 'home').map(
    (section) => `
      <a class="account-home__nav-item" href="${section.path}">
        <svg class="icon account-home__nav-icon" aria-hidden="true"><use href="#${section.icon}"></use></svg>
        <span>${section.label}</span>
      </a>`,
  ).join('');
  return `
    <div class="account-home">
      <div class="account-summary">
        <div class="account-summary__info">
          <h1 class="account-summary__name">${name}</h1>
          ${user.phone ? `<p class="account-summary__contact">${user.phone}</p>` : ''}
          ${user.email ? `<p class="account-summary__contact">${user.email}</p>` : ''}
        </div>
        <a class="btn btn--primary btn--filled-tablet account-summary__edit" href="/account/profile">
          <span>Изменить</span>
          <svg class="icon btn__icon" aria-hidden="true"><use href="#icon-arrow-circle"></use></svg>
        </a>
      </div>

      <nav class="account-home__menu" aria-label="Разделы кабинета">${menu}</nav>

      <div class="account-home__dashboard">
        ${orders.length ? `
          <section class="account-section">
            ${sectionHead('Мои заказы', '/account/orders')}
            <div class="order-list">${orders.map(renderOrderCard).join('')}</div>
          </section>` : ''}
        ${favorites.length ? `
          <section class="account-section">
            ${sectionHead('Избранные товары', '/account/favorites')}
            <div class="account__grid">${favorites.map(renderProductCard).join('')}</div>
          </section>` : ''}
      </div>

      <button class="btn btn--primary btn--ghost-dark account-home__logout" type="button" data-account-logout>
        <span>Выйти из профиля</span>
        <svg class="icon btn__icon" aria-hidden="true"><use href="#icon-arrow-circle"></use></svg>
      </button>
    </div>`;
}

function renderOrderItem(item) {
  const favClass = favoritesStore.has(item.id) ? ' is-active' : '';
  const price = item.oldPrice
    ? `<span class="order-item__price-old">${formatPrice(item.oldPrice)}</span><span class="order-item__price-new">${formatPrice(item.price)}</span>`
    : `<span class="order-item__price-new">${formatPrice(item.price)}</span>`;
  const meta = `${item.qty > 1 ? `<b>x ${item.qty}</b> | ` : ''}${item.size} | ${item.color}`;
  return `
    <article class="order-item" data-product-id="${item.id}">
      <span class="order-item__media"><img src="${imageUrl(item.image)}" alt="${item.title}" loading="lazy" /></span>
      <div class="order-item__body">
        <span class="order-item__brand">${item.brand}</span>
        <a class="order-item__title" href="/product/${item.id}">${item.title}</a>
        <span class="order-item__meta">${meta}</span>
      </div>
      <button class="order-item__fav${favClass}" type="button" data-fav aria-label="В избранное">
        <svg class="icon order-item__heart order-item__heart--outline" aria-hidden="true"><use href="#icon-favorite"></use></svg>
        <svg class="icon order-item__heart order-item__heart--fill" aria-hidden="true"><use href="#icon-heart"></use></svg>
      </button>
      <div class="order-item__price">${price}</div>
    </article>`;
}

function renderOrderDetail(order) {
  const status = ORDER_STATUS[order.status] ?? ORDER_STATUS.created;
  return `
    <div class="order-detail">
      <a class="order-detail__back" href="/account/orders" aria-label="Назад к заказам">
        <svg class="icon icon--flip" aria-hidden="true"><use href="#icon-arrow-right"></use></svg>
      </a>
      <div class="order-detail__body">
        <div class="order-detail__head">
          <h1 class="order-detail__num">Заказ № ${order.id}</h1>
          ${statusBadge(status)}
        </div>
        <p class="order-detail__date">
          <svg class="icon order-detail__icon" aria-hidden="true"><use href="#icon-date"></use></svg>
          ${order.date}, ${order.time}
        </p>
        <p class="order-detail__line"><b>${order.delivery}</b> ${order.address}</p>
        <p class="order-detail__line"><b>Способ оплаты</b> ${order.payment}</p>

        <h2 class="order-detail__subtitle">Сумма заказов</h2>
        <div class="order-detail__sum">
          <div class="order-detail__sum-row"><span>Стоимость товаров</span><span>${formatPrice(order.itemsTotal)}</span></div>
          ${order.discount ? `<div class="order-detail__sum-row order-detail__sum-row--discount"><span>Скидка</span><span>−${formatPrice(order.discount)}</span></div>` : ''}
          <div class="order-detail__sum-row order-detail__sum-row--strong"><span>Доставка</span><span>${order.shipping ? formatPrice(order.shipping) : 'Бесплатно'}</span></div>
          <div class="order-detail__sum-row order-detail__sum-row--total"><span>Итого</span><span>${formatPrice(order.total)}</span></div>
        </div>

        <button class="btn btn--primary btn--ghost-dark order-detail__repeat" type="button" data-order-repeat="${order.id}">
          <span>Повторить</span>
          <svg class="icon btn__icon" aria-hidden="true"><use href="#icon-repeat"></use></svg>
        </button>

        <h2 class="order-detail__subtitle">Состав заказа</h2>
        <div class="order-detail__items">${order.items.map(renderOrderItem).join('')}</div>
      </div>
    </div>`;
}

function renderContent(active) {
  if (active === 'favorites') return renderFavorites();
  if (active === 'profile') return renderProfile();
  if (active === 'orders') {
    const id = orderId();
    const order = id ? mockApi.getOrders().find((entry) => entry.id === id) : null;
    return order ? renderOrderDetail(order) : renderOrders();
  }
  return renderHome();
}

function render() {
  const active = activeSection();
  root.innerHTML = `
    ${renderMenu(active)}
    <div class="surface account__board">
      ${renderContent(active)}
    </div>`;
}

async function saveProfile(form) {
  const consent = form.querySelector('[data-consent]');
  consent.closest('.check').classList.toggle('is-invalid', !consent.checked);
  if (!consent.checked) return;

  const get = (name) => form.querySelector(`[data-name="${name}"]`)?.value.trim() ?? '';
  const user = await authApi.updateProfile({
    gender: form.querySelector('.account-form__gender-btn.is-active')?.dataset.gender ?? 'female',
    firstName: get('firstName'),
    lastName: get('lastName'),
    phone: get('phone'),
    email: get('email'),
    address: get('address'),
    apartment: get('apartment'),
    entrance: get('entrance'),
    floor: get('floor'),
    privateHouse: form.querySelector('[data-private-house]')?.checked ?? false,
  });
  authStore.set(user);

  const note = form.querySelector('[data-profile-note]');
  if (note) {
    note.textContent = 'Данные сохранены';
    note.classList.add('is-visible');
  }
}

export async function initAccountPage() {
  root = document.querySelector('[data-account-page]');
  if (!root) return;

  const user = await authApi.user();
  if (!user) {
    go('/');
    return;
  }
  authStore.set(user);
  render();

  root.addEventListener('click', async (event) => {
    if (event.target.closest('[data-account-logout]')) {
      await authApi.logout();
      authStore.clear();
      go('/');
      return;
    }
    const gender = event.target.closest('[data-gender]');
    if (gender) {
      root.querySelectorAll('[data-gender]').forEach((button) => button.classList.toggle('is-active', button === gender));
      return;
    }
  });

  root.addEventListener('submit', (event) => {
    if (event.target.matches('[data-account-profile]')) {
      event.preventDefault();
      saveProfile(event.target);
    }
  });

  favoritesStore.subscribe(() => {
    const active = activeSection();
    if (active === 'favorites' || active === 'home') render();
  });
}
