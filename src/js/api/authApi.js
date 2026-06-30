import http, { API_URL } from './http.js';

const USERS_KEY = 'artic:users';
const SESSION_KEY = 'artic:user';
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

function readUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

function writeUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function publicUser(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
}

function fieldError(message, field) {
  const error = new Error(message);
  error.field = field;
  return error;
}

const mock = {
  async register(payload) {
    await delay();
    const users = readUsers();
    if (users.some((user) => user.email === payload.email)) throw fieldError('Этот email уже зарегистрирован', 'email');
    users.push({ ...payload, verified: false });
    writeUsers(users);
    return { email: payload.email };
  },
  async login({ email, password }) {
    await delay();
    const user = readUsers().find((item) => item.email === email && item.password === password);
    if (!user) throw new Error('Неверный email или пароль');
    localStorage.setItem(SESSION_KEY, JSON.stringify(publicUser(user)));
    return publicUser(user);
  },
  async logout() {
    await delay(120);
    localStorage.removeItem(SESSION_KEY);
  },
  async user() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch {
      return null;
    }
  },
  async forgotPassword({ email }) {
    await delay();
    return { email };
  },
  async verify({ email, code }) {
    await delay();
    if (!/^\d{4,6}$/.test(String(code))) throw new Error('Неверный код подтверждения');
    const users = readUsers();
    const user = users.find((item) => item.email === email);
    if (user) {
      user.verified = true;
      writeUsers(users);
      localStorage.setItem(SESSION_KEY, JSON.stringify(publicUser(user)));
    }
    return publicUser(user);
  },
  async resetPassword({ email, password }) {
    await delay();
    const users = readUsers();
    const user = users.find((item) => item.email === email);
    if (user) {
      user.password = password;
      writeUsers(users);
    }
    return { email };
  },
  async updateProfile(patch) {
    await delay();
    const current = JSON.parse(localStorage.getItem(SESSION_KEY)) || {};
    const users = readUsers();
    const stored = users.find((item) => item.email === current.email);
    if (stored) {
      Object.assign(stored, patch);
      writeUsers(users);
    }
    const updated = { ...current, ...patch };
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
    return updated;
  },
};

const csrf = () => http.get('/sanctum/csrf-cookie');

const real = {
  async register(payload) {
    await csrf();
    return (await http.post('/register', payload)).data;
  },
  async login(payload) {
    await csrf();
    return (await http.post('/login', payload)).data;
  },
  async logout() {
    await http.post('/logout');
  },
  async user() {
    try {
      return (await http.get('/api/user')).data;
    } catch {
      return null;
    }
  },
  async forgotPassword(payload) {
    await csrf();
    return (await http.post('/forgot-password', payload)).data;
  },
  async verify(payload) {
    await csrf();
    return (await http.post('/email/verify', payload)).data;
  },
  async resetPassword(payload) {
    await csrf();
    return (await http.post('/reset-password', payload)).data;
  },
  async updateProfile(patch) {
    await csrf();
    return (await http.put('/user/profile', patch)).data;
  },
};

export default API_URL ? real : mock;
