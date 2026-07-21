import { createAssetResolver } from '../utils/assets.js';
import { formatPrice } from '../utils/productAssets.js';
import { renderBreadcrumbs } from '../utils/breadcrumbs.js';
import { setSlot } from '../utils/dom.js';
import { renderActions } from '../components/ctaActions.js';
import mockApi from '../api/mockApi.js';
import cartStore from './cartStore.js';
import { setBuyNow } from './orderSummary.js';
import { startCheckout } from './authGate.js';
import { showCartToast } from './cartToast.js';

const imageUrl = createAssetResolver(
  import.meta.glob('../../assets/images/gift/*.webp', { eager: true, query: '?url', import: 'default' }),
);

let root = null;
let data = null;
let activeAmount = 0;
let activeType = 0;

function renderMedia() {
  return `<img class="gift__img" src="${imageUrl(data.image)}" alt="${data.title}" />`;
}

function renderInfo() {
  const amounts = data.amounts
    .map(
      (value, i) =>
        `<button class="gift__amount${i === activeAmount ? ' is-active' : ''}" type="button" data-amount="${i}">${formatPrice(value)}</button>`,
    )
    .join('');
  const types = data.types
    .map(
      (type, i) => `
      <button class="gift__type${i === activeType ? ' is-active' : ''}" type="button" data-type="${i}">
        <svg class="icon gift__type-icon" aria-hidden="true"><use href="#${type.icon}"></use></svg>
        <span>${type.label}</span>
      </button>`,
    )
    .join('');

  return `
    <h1 class="gift__title">${data.title}</h1>

    <div class="gift__row">
      <span class="gift__label">Выберите сумму подарка</span>
      <div class="gift__amounts">${amounts}</div>
    </div>

    <div class="gift__row">
      <span class="gift__label">Вид сертификата</span>
      <div class="gift__types">${types}</div>
    </div>

    ${renderActions()}`;
}

const slot = (name, html) => setSlot(root, name, html);

function render() {
  slot('breadcrumbs', renderBreadcrumbs(data.breadcrumbs));
  slot('media', renderMedia());
  slot('info', renderInfo());
}

function onClick(event) {
  const amount = event.target.closest('[data-amount]');
  if (amount) {
    activeAmount = Number(amount.dataset.amount);
    slot('info', renderInfo());
    return;
  }
  const type = event.target.closest('[data-type]');
  if (type) {
    activeType = Number(type.dataset.type);
    slot('info', renderInfo());
    return;
  }
  if (event.target.closest('[data-add-cart]')) {
    const { line, amount, type, image } = buildLine();
    cartStore.add(line);
    showCartToast({ image, brand: data.title, title: formatPrice(amount), size: type.label, color: '' });
    return;
  }
  if (event.target.closest('[data-buy-now]')) {
    setBuyNow(buildLine().line);
    startCheckout();
  }
}

function buildLine() {
  const amount = data.amounts[activeAmount];
  const type = data.types[activeType];
  const line = {
    key: `gift:${amount}:${type.id}`,
    productId: null,
    image: data.image,
    brand: data.title,
    title: formatPrice(amount),
    meta: type.label,
    price: amount,
    oldPrice: null,
    href: '/gift',
  };
  return { line, amount, type, image: imageUrl(data.image) };
}

export async function initGift() {
  root = document.querySelector('[data-gift]');
  if (!root) return;

  data = await mockApi.getGiftCard();
  document.title = `${data.title} — Artic Store`;
  render();

  root.addEventListener('click', onClick);
}
