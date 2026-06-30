export const BASE = import.meta.env.BASE_URL;

const ROUTE_KEY = 'artic:route';
const trimEnd = (value) => value.replace(/\/$/, '');

const ENTRIES = [
  [/^\/catalog(\/|$)/, 'catalog.html'],
  [/^\/product(\/|$)/, 'product.html'],
  [/^\/gift(\/|$)/, 'gift.html'],
  [/^\/payment(\/|$)/, 'payment.html'],
  [/^\/delivery(\/|$)/, 'delivery.html'],
  [/^\/privacy(\/|$)/, 'privacy.html'],
  [/^\/contacts(\/|$)/, 'contacts.html'],
  [/^\/account(\/|$)/, 'account.html'],
];

function entryFor(path) {
  const hit = ENTRIES.find(([test]) => test.test(path));
  return hit ? hit[1] : 'index.html';
}

export function routePath() {
  const path = window.location.pathname;
  return BASE !== '/' && path.startsWith(BASE) ? `/${path.slice(BASE.length)}` : path;
}

export function go(path) {
  if (BASE === '/') {
    window.location.href = path;
    return;
  }
  sessionStorage.setItem(ROUTE_KEY, trimEnd(BASE) + path);
  window.location.assign(`${trimEnd(BASE)}/${entryFor(path.split('?')[0])}`);
}

export function restoreRoute() {
  const route = sessionStorage.getItem(ROUTE_KEY);
  if (!route) return;
  sessionStorage.removeItem(ROUTE_KEY);
  window.history.replaceState(null, '', route);
}

export function initBaseRouting() {
  if (BASE === '/') return;
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
    const link = event.target.closest('a[href^="/"]');
    if (!link || link.target === '_blank') return;
    const href = link.getAttribute('href');
    if (href.startsWith('//')) return;
    event.preventDefault();
    sessionStorage.setItem(ROUTE_KEY, trimEnd(BASE) + href);
    window.location.assign(`${trimEnd(BASE)}/${entryFor(href.split('?')[0])}`);
  });
}
