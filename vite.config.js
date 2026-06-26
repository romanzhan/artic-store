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
  ];
  const rewrite = (req) => {
    const [path, query] = (req.url || '').split('?');
    if (path.slice(1).includes('.')) return;
    const hit = routes.find((route) => route.test.test(path));
    if (hit) req.url = `${hit.file}${query ? `?${query}` : ''}`;
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
      },
    },
  },
});
