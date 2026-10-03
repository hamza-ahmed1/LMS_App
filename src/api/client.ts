import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_TIMEOUT_MS } from '@/config';
import { tokenStorage } from '@/utils/tokenStorage';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the bearer token to every request.
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await tokenStorage.getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Callback the AuthContext registers so a 401 anywhere in the app
// can force a clean logout instead of leaving stale screens up.
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // NOTE: the backend's /api/auth/refresh relies on an httpOnly
      // refresh-token cookie, which browsers handle automatically but
      // React Native does not persist the same way across requests.
      // If you want silent refresh on mobile, the simplest fix is to
      // also return the refresh token in the login/refresh JSON body
      // so it can be stored and sent explicitly. Until then, a 401
      // here just signs the user out cleanly.
      await tokenStorage.clearAll();
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

/** Turns an AxiosError into a short, user-friendly message. */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as any;
    if (typeof data === 'string' && data.trim().length > 0) return data;
    if (data?.message) return data.message;
    if (Array.isArray(data?.errors) && data.errors.length) {
      return data.errors.map((e: any) => e.description ?? e.message ?? e).join('\n');
    }
    if (data?.errors && typeof data.errors === 'object') {
      return Object.values(data.errors).flat().join('\n');
    }
    if (error.code === 'ECONNABORTED') return 'The request timed out. Check your connection and API address in src/config.ts.';
    if (error.message === 'Network Error') return 'Could not reach the server. Check that the API base URL in src/config.ts is correct and reachable from this device.';
  }
  return fallback;
}
