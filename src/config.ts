import Constants from 'expo-constants';

/**
 * ============================================================
 *  EDIT THIS FILE TO POINT THE APP AT YOUR BACKEND
 * ============================================================
 * The app uses the deployed Azure API by default, in development and release builds.
 *
 * To test against the backend running on this PC instead, set USE_LOCAL_API to true.
 * The phone then calls the PC that serves the app through Expo (same Wi-Fi), on DEV_API_PORT.
 * "localhost" would not work on a phone: it means the phone itself, not your PC.
 * ============================================================
 */
const DEPLOYED_API_BASE_URL = 'https://tcflmsapiv1-hmcfd9fgfxfafrcc.westus3-01.azurewebsites.net';

const USE_LOCAL_API = false;

/** Port the ASP.NET backend listens on (launchSettings "http" profile). */
const DEV_API_PORT = 5000;

/**
 * In development the phone already reaches this PC through the Expo dev server
 * (e.g. "192.168.1.6:8081"), so a local API is assumed to run on that same machine.
 * This keeps working when the PC's IP changes.
 */
function apiUrlFromDevServer(): string | null {
  if (!USE_LOCAL_API || !__DEV__) return null;
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') return null;
  return `http://${host}:${DEV_API_PORT}`;
}

export const API_BASE_URL = (apiUrlFromDevServer() ?? DEPLOYED_API_BASE_URL).replace(/\/+$/, '');

export const APP_NAME = 'TCF Campus';

// How long (ms) to wait before an API call is considered failed.
export const API_TIMEOUT_MS = 15000;
