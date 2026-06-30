import mockApi from '../api/mockApi.js';

let lines = mockApi.getCart();
const listeners = new Set();

function notify() {
  mockApi.saveCart(lines);
  for (const listener of listeners) listener();
}

export const cartStore = {
  lines() {
    return lines;
  },

  count() {
    return lines.reduce((total, line) => total + line.qty, 0);
  },

  subtotal() {
    return lines.reduce((sum, line) => sum + line.price * line.qty, 0);
  },

  add(line) {
    const existing = lines.find((item) => item.key === line.key);
    if (existing) existing.qty += 1;
    else lines.push({ ...line, qty: 1 });
    notify();
  },

  setQty(key, qty) {
    const line = lines.find((item) => item.key === key);
    if (!line) return;
    line.qty = Math.max(1, qty);
    notify();
  },

  remove(key) {
    lines = lines.filter((item) => item.key !== key);
    notify();
  },

  clear() {
    lines = [];
    notify();
  },

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export default cartStore;
