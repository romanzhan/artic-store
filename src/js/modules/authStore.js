import authApi from '../api/authApi.js';

let user = null;
const listeners = new Set();

function notify() {
  for (const listener of listeners) listener();
}

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
