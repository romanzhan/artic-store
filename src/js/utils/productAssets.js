import { createAssetResolver } from './assets.js';

export const imageUrl = createAssetResolver(
  import.meta.glob('../../assets/images/products/*.webp', { eager: true, query: '?url', import: 'default' }),
);

export const cartImageUrl = createAssetResolver(
  import.meta.glob(['../../assets/images/products/*.webp', '../../assets/images/gift/*.webp'], {
    eager: true,
    query: '?url',
    import: 'default',
  }),
);

const logoUrl = createAssetResolver(
  import.meta.glob('../../assets/images/brands/*.webp', { eager: true, query: '?url', import: 'default' }),
);

const BRAND_SLUG = { Premiata: 'premiata', PJS: 'pjs' };
const BRAND_SLUG_POOL = ['premiata', 'pjs'];

const brandSlug = (brand) =>
  BRAND_SLUG[brand] ?? BRAND_SLUG_POOL[[...brand].reduce((sum, char) => sum + char.charCodeAt(0), 0) % BRAND_SLUG_POOL.length];

export const formatPrice = (value) => `${value.toLocaleString('ru-RU')} ₽`;

export const discountPercent = (product) => Math.round((1 - product.price / product.oldPrice) * 100);

function badgeText(product) {
  if (product.oldPrice) return `−${discountPercent(product)}%`;
  if (product.label === 'trend') return 'Тренд';
  if (product.label === 'new') return 'Новинка';
  return '';
}

export function renderBadge(product, base) {
  const text = badgeText(product);
  return text ? `<span class="${base}__badge">${text}</span>` : '';
}

export function renderBrand(product, base) {
  const url = logoUrl(brandSlug(product.brand));
  return url
    ? `<img class="${base}__brand-logo" src="${url}" alt="${product.brand}" />`
    : `<span class="${base}__brand">${product.brand}</span>`;
}
