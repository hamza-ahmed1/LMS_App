import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT_MS } from '@/config';
import { tokenStorage } from '@/utils/tokenStorage';
import { AuthResponse } from '@/types';

/**
 * Access tokens last 30 minutes. The app keeps the refresh token (sent only to mobile clients,
 * see login's X-Client-Type header) and swaps it for a new access token when needed.
 * Used by the API client, the live notification connection and the background task.
 */

let refreshInFlight: Promise<string | null> | null = null;

/** Exchanges the stored refresh token for a new access token. Concurrent callers share one request. */
export function refreshSession(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (!refreshToken) return null;
      try {
        // Plain axios, not apiClient, so a 401 here can't loop back into the refresh interceptor
        const { data } = await axios.post<AuthResponse>(
          `${API_BASE_URL}/api/auth/refresh`,
          { refreshToken },
          { timeout: API_TIMEOUT_MS, headers: { 'Content-Type': 'application/json' } }
        );
        await tokenStorage.setAccessToken(data.accessToken);
        if (data.refreshToken) await tokenStorage.setRefreshToken(data.refreshToken);
        return data.accessToken;
      } catch (error) {
        // Only a definite rejection ends the session; network errors leave it for the next try
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          await tokenStorage.clearAll();
        }
        return null;
      }
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

/** Returns an access token that is good for at least another minute, refreshing it if necessary. */
export async function getValidAccessToken(): Promise<string | null> {
  const token = await tokenStorage.getAccessToken();
  if (token && !isExpiringSoon(token)) return token;
  return (await refreshSession()) ?? token;
}

function isExpiringSoon(token: string): boolean {
  try {
    const payload = JSON.parse(decodeBase64Url(token.split('.')[1] ?? '')) as { exp?: number };
    return typeof payload.exp === 'number' && payload.exp * 1000 - Date.now() < 60_000;
  } catch {
    return false;
  }
}

// Small decoder so this works whether or not the JS engine provides atob
function decodeBase64Url(input: string): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const text = input.replace(/-/g, '+').replace(/_/g, '/');
  let output = '';
  let buffer = 0;
  let bits = 0;
  for (const char of text) {
    const value = alphabet.indexOf(char);
    if (value < 0) continue;
    buffer = ((buffer << 6) | value) & 0xffffff;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return output;
}
