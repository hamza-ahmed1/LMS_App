/**
 * ============================================================
 *  EDIT THIS FILE TO POINT THE APP AT YOUR BACKEND
 * ============================================================
 * `http://localhost:5000` (from the requirements doc) only works
 * when the API and the app are running on the exact same machine
 * in a browser. On a phone, an emulator, or Expo Go, "localhost"
 * means the device itself, not your dev machine, so it will fail.
 *
 * Replace the value below with one of:
 *   - Your computer's LAN IP, e.g. "http://192.168.1.50:5000"
 *     (same Wi-Fi network as your phone/emulator)
 *   - "http://10.0.2.2:5000" if you're using the Android Studio
 *     emulator specifically (it maps to your host machine)
 *   - Your real deployed API URL, e.g. "https://api.eduverse.com"
 *
 * Find your LAN IP:
 *   Windows:  ipconfig            -> "IPv4 Address"
 *   Mac/Linux: ifconfig | grep inet
 * ============================================================
 */
export const API_BASE_URL = 'http://192.168.1.2:5000';

export const APP_NAME = 'Eduverse';

// How long (ms) to wait before an API call is considered failed.
export const API_TIMEOUT_MS = 15000;
