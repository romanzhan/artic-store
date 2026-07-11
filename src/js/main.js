import '@fontsource/inter/latin-300.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/inter/latin-900.css';
import '@fontsource/inter/cyrillic-300.css';
import '@fontsource/inter/cyrillic-400.css';
import '@fontsource/inter/cyrillic-500.css';
import '@fontsource/inter/cyrillic-600.css';
import '@fontsource/inter/cyrillic-700.css';
import '@fontsource/inter/cyrillic-900.css';
import '@fontsource/noto-sans/latin-400.css';
import '@fontsource/noto-sans/latin-500.css';
import '@fontsource/noto-sans/latin-700.css';
import '@fontsource/noto-sans/latin-900.css';
import '@fontsource/noto-sans/cyrillic-400.css';
import '@fontsource/noto-sans/cyrillic-500.css';
import '@fontsource/noto-sans/cyrillic-700.css';
import '@fontsource/noto-sans/cyrillic-900.css';

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
import { initGift } from './modules/gift.js';
import { initCart } from './modules/cart.js';
import { initOrderSummary } from './modules/orderSummary.js';
import { initAuthGate } from './modules/authGate.js';
import { initCheckout } from './modules/checkout.js';
import { initCheckoutDrawer } from './modules/checkoutDrawer.js';
import { initOrderSuccess } from './modules/orderSuccess.js';
import { initAuth } from './modules/auth.js';
import { initAccountPage } from './modules/accountPage.js';
import { initContacts } from './modules/contacts.js';
import { initAuthStore } from './modules/authStore.js';
import { initFavorites } from './modules/favorites.js';
import { restoreRoute, initBaseRouting } from './utils/base.js';

restoreRoute();

function bootstrap() {
  initBaseRouting();
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
  initGift();
  initCart();
  initOrderSummary();
  initAuthGate();
  initCheckout();
  initCheckoutDrawer();
  initOrderSuccess();
  initAuth();
  initAccountPage();
  initContacts();
  initAuthStore();
  initFavorites();
}

document.addEventListener('DOMContentLoaded', bootstrap);
