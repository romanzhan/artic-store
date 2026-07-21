import authApi, { SESSION_KEY } from '../api/authApi.js';

let user = null;
const listeners = new Set();

function notify() {
  for (const listener of listeners) listener();
}

window.addEventListener('storage', async (event) => {
  if (event.key !== null && event.key !== SESSION_KEY) return;
  user = await authApi.user();
  notify();
});

export const authStore = {
  user() {
    return user;
  },

  isAuthed() {
    return Boolean(user);
  },

  set(value) {
    user = value || null;
    notify();
  },

  clear() {
    user = null;
    notify();
  },

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export async function initAuthStore() {
  user = await authApi.user();
  notify();
}

export default authStore;
