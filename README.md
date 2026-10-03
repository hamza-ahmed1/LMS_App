# Eduverse — Student LMS App (React Native / Expo)

A student-facing mobile app with 5 screens: **Home**, **Attendance**, **Marks**,
**Fee Chalan**, and **Settings** (Profile + Change Password), plus a full
**Login / Forgot Password** flow, built against the API endpoints described in
the requirements doc.

## 1. Install

```bash
npm install
```

## 2. Point the app at your backend (required)

Open `src/config.ts` and set `API_BASE_URL` to an address your phone/emulator
can actually reach — `localhost` only works if the API and the viewer are on
the exact same machine in a browser, which isn't the case for a phone/emulator.

```ts
export const API_BASE_URL = 'http://192.168.1.50:5000'; // <- your machine's LAN IP
```

- **Physical phone via Expo Go**: use your computer's LAN IP (same Wi-Fi as
  your phone). Find it with `ipconfig` (Windows) or `ifconfig` (Mac/Linux).
- **Android Studio emulator**: `http://10.0.2.2:5000` maps to your host
  machine automatically.
- **iOS Simulator on the same Mac**: `http://localhost:5000` does work here,
  since the simulator shares the Mac's network stack.
- **Deployed API**: use its real URL, e.g. `https://api.eduverse.com`.

Also make sure your ASP.NET backend is listening on `0.0.0.0` (not just
`127.0.0.1`) and that your firewall allows inbound connections on port 5000,
or a phone on the same Wi-Fi won't be able to reach it.

## 3. Run

```bash
npx expo start
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS), or press
`a` / `i` in the terminal for an emulator/simulator.

## What's implemented

| Screen | Notes |
|---|---|
| **Login** | `POST /api/auth/login` |
| **Forgot Password** | `POST /api/auth/send-reset-code` → `POST /api/auth/verify-and-reset` |
| **Home** | `GET /api/student/{userId}` — institute info, personal info, family info |
| **Attendance** | `GET /api/attendance/student/{studentId}/courses` then `GET /api/Attendance/student/{studentId}?courseId=` per course, with a course picker and a present/total summary |
| **Marks** | `GET /api/Examresult/student={studentId}` |
| **Fee Chalan** | `GET /api/invoice/pending/{studentId}` — status 0 = Unpaid, 1 = Paid |
| **Settings → My Profile** | Read-only view of the student record |
| **Settings → Change Password** | `POST /api/auth/change-password` |
| **Logout** | `POST /api/auth/logout` |

## Known quirks carried over from the API (not bugs on our end)

- The **exam results** endpoint's path is literally
  `/api/Examresult/student={studentId}` (the id is glued onto the path with
  `=`, not a normal `/student/{id}` segment or a `?` query string) —
  reproduced exactly as specified in `src/api/marks.ts`.
- The **change-password** request body field is spelled `NewPasword` (missing
  an "s") to match the backend's `ChangePasswordDto` exactly — see the
  comment in `src/api/auth.ts`.
- Several **Home** fields the requirements list (batch, major subject,
  campus, status, gender, father's name) weren't in the sample JSON response
  in the doc. The UI shows "N/A" for any of these the backend doesn't
  actually return — once your real API includes them, they'll appear
  automatically since the field names already match.

## Auth session notes

- The access token (JWT) is stored securely on-device with `expo-secure-store`
  and attached to every request as a `Bearer` token.
- The backend's `/api/auth/refresh` endpoint relies on an `httpOnly` cookie,
  which works automatically in a browser but doesn't behave the same way in
  React Native. Right now, a `401` response just signs the user out cleanly
  and sends them back to the Login screen. If you want silent token refresh
  on mobile, the simplest backend change is to also return the refresh token
  in the JSON body (not only as a cookie) so the app can store and send it
  explicitly — happy to wire that up once that change is in place.

## Project structure

```
App.tsx
src/
  api/            axios client + one file per feature (auth, student, attendance, marks, fees)
  components/     shared UI (Card, TextField, PrimaryButton, state views, etc.)
  context/        AuthContext — session state, login/logout, student profile
  navigation/     AuthStack, bottom-tab MainTabs, RootNavigator
  screens/        one file per screen
  theme/          colors, spacing, typography tokens
  types/          TypeScript interfaces matching the API responses
  config.ts       <- API_BASE_URL lives here
```
