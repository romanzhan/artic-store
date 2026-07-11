import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import handlebars from 'vite-plugin-handlebars';

const siteContext = {
  siteName: 'Artic Store',
  year: 2026,
};

function cleanUrls() {
  const routes = [
    { test: /^\/catalog(\/|$)/, file: '/catalog.html' },
    { test: /^\/product(\/|$)/, file: '/product.html' },
    { test: /^\/gift(\/|$)/, file: '/gift.html' },
    { test: /^\/payment(\/|$)/, file: '/payment.html' },
    { test: /^\/delivery(\/|$)/, file: '/delivery.html' },
    { test: /^\/privacy(\/|$)/, file: '/privacy.html' },
    { test: /^\/contacts(\/|$)/, file: '/contacts.html' },
    { test: /^\/account(\/|$)/, file: '/account.html' },
  ];
  const rewrite = (req) => {
    const [path, query] = (req.url || '').split('?');
    if (path === '/' || path.slice(1).includes('.') || path.startsWith('/@') || path.startsWith('/__')) return;
    const hit = routes.find((route) => route.test.test(path));
    req.url = `${hit ? hit.file : '/not-found.html'}${query ? `?${query}` : ''}`;
  };
  const middleware = (req, _res, next) => {
    rewrite(req);
    next();
  };
  return {
    name: 'clean-urls',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig({
  base: process.env.VITE_BASE ? `/${process.env.VITE_BASE.replace(/^\/+|\/+$/g, '')}/` : '/',
  plugins: [
    cleanUrls(),
    handlebars({
      partialDirectory: resolve(import.meta.dirname, 'src/partials'),
      context: siteContext,
    }),
  ],
  css: {
    devSourcemap: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        catalog: resolve(import.meta.dirname, 'catalog.html'),
        product: resolve(import.meta.dirname, 'product.html'),
        gift: resolve(import.meta.dirname, 'gift.html'),
        payment: resolve(import.meta.dirname, 'payment.html'),
        delivery: resolve(import.meta.dirname, 'delivery.html'),
        privacy: resolve(import.meta.dirname, 'privacy.html'),
        contacts: resolve(import.meta.dirname, 'contacts.html'),
        account: resolve(import.meta.dirname, 'account.html'),
        'not-found': resolve(import.meta.dirname, 'not-found.html'),
      },
    },
  },
});
