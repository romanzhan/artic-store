import mockApi, { STORAGE_KEYS } from '../api/mockApi.js';

const ids = new Set(mockApi.getFavoriteIds());
const listeners = new Set();

function notify() {
  for (const listener of listeners) listener();
}

window.addEventListener('storage', (event) => {
  if (event.key !== null && event.key !== STORAGE_KEYS.favorites) return;
  ids.clear();
  for (const id of mockApi.getFavoriteIds()) ids.add(id);
  notify();
});

export const favoritesStore = {
  has(id) {
    return ids.has(id);
  },

  count() {
    return ids.size;
  },

  toggle(id) {
    if (ids.has(id)) {
      ids.delete(id);
      mockApi.removeFavorite(id);
    } else {
      ids.add(id);
      mockApi.addFavorite(id);
    }
    notify();
    return ids.has(id);
  },

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export default favoritesStore;
