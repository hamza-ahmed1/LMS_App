import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_TIMEOUT_MS } from '@/config';
import { tokenStorage } from '@/utils/tokenStorage';
import { refreshSession } from '@/api/session';

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

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const isAuthCall = original?.url?.startsWith('/api/auth/login') || original?.url?.startsWith('/api/auth/refresh');

    if (error.response?.status === 401 && original && !original._retried && !isAuthCall) {
      // The access token expired: swap the stored refresh token for a new one and retry once
      original._retried = true;
      const token = await refreshSession();
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      }
    }

    if (error.response?.status === 401 && !isAuthCall) {
      // Refresh token missing, expired or revoked: sign out cleanly
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
