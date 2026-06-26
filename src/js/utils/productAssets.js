import { createAssetResolver } from './assets.js';

export const imageUrl = createAssetResolver(
  import.meta.glob('../../assets/images/products/*.webp', { eager: true, query: '?url', import: 'default' }),
);

export const logoUrl = createAssetResolver(
  import.meta.glob('../../assets/images/brands/*.webp', { eager: true, query: '?url', import: 'default' }),
);

export const BRAND_SLUG = { Premiata: 'premiata', PJS: 'pjs' };

export const formatPrice = (value) => `${value.toLocaleString('ru-RU')} ₽`;
