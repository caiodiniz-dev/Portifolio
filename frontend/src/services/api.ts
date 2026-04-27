import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

console.log('[API] Using baseURL:', API_URL);

api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('finix_token') || sessionStorage.getItem('finix_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('finix_token');
      sessionStorage.removeItem('finix_token');
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register') && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export function apiErrorMessage(e: any): string {
  // Try different error message formats from backend
  const data = e?.response?.data;
  if (typeof data?.detail === 'string') return data.detail;
  if (typeof data?.error === 'string') return data.error;
  if (typeof data?.message === 'string') return data.message;
  if (Array.isArray(data?.detail)) return data.detail.map((x: any) => x?.msg || JSON.stringify(x)).join(' ');
  if (e?.message) return e.message;
  return 'Algo deu errado';
}
