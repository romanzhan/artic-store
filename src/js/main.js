import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/inter/latin-900.css';
import '@fontsource/inter/cyrillic-400.css';
import '@fontsource/inter/cyrillic-500.css';
import '@fontsource/inter/cyrillic-600.css';
import '@fontsource/inter/cyrillic-700.css';
import '@fontsource/inter/cyrillic-900.css';
import '@fontsource/noto-sans/latin-400.css';
import '@fontsource/noto-sans/latin-500.css';
import '@fontsource/noto-sans/latin-700.css';
import '@fontsource/noto-sans/cyrillic-400.css';
import '@fontsource/noto-sans/cyrillic-500.css';
import '@fontsource/noto-sans/cyrillic-700.css';

import '../scss/main.scss';

import { initOverlay } from './modules/overlay.js';
import { initMegaMenu } from './modules/megaMenu.js';
import { initMobileMenu } from './modules/mobileMenu.js';
import { initSearch } from './modules/search.js';
import { initHeroSlider } from './modules/heroSlider.js';
import { initProductsSlider } from './modules/productsSlider.js';
import { initPromo } from './modules/promo.js';
import { initBlogSlider } from './modules/blogSlider.js';
import { initCatalog } from './modules/catalog.js';
import { initProduct } from './modules/product.js';
import { initFavorites } from './modules/favorites.js';

function bootstrap() {
  initOverlay();
  initMegaMenu();
  initMobileMenu();
  initSearch();
  initHeroSlider();
  initProductsSlider();
  initPromo();
  initBlogSlider();
  initCatalog();
  initProduct();
  initFavorites();
}

document.addEventListener('DOMContentLoaded', bootstrap);
