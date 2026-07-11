import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || '';

const http = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: { Accept: 'application/json' },
});

export default http;
