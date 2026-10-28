# Eduverse — Student LMS App (React Native / Expo SDK 58)

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
| **Alerts (Notifications)** | `GET /api/notifications`, `POST /api/notifications/{id}/read`, `POST /api/notifications/read-all`, live updates over SignalR (`/hubs/notifications`) |
| **Logout** | `POST /api/auth/logout` (revokes this device's refresh token) |

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

- Tokens are stored on-device with `expo-secure-store`; the access token is sent as a `Bearer` token.
- Login sends `X-Client-Type: mobile`, so the backend also returns the **refresh token** in the JSON body
  (browsers keep using the httpOnly cookie). Access tokens last 30 minutes; when one expires, the axios
  interceptor (`src/api/client.ts`) swaps the refresh token for a new one and retries the request.
  The refresh token stays valid for 7 days after the student last used the app, so a student who opens
  it at least weekly stays signed in. A rejected refresh signs the student out.

## Notifications

Students receive notices sent by their teachers, HOD and administration.

- **App open:** a SignalR connection (`src/context/NotificationsContext.tsx`) delivers notices instantly,
  shows a system notification, updates the **Alerts** tab badge and confirms receipt to the server.
  The connection is held only while the app is in the foreground and the inbox is reloaded whenever the
  app comes back, so nothing is missed.
- **App closed:** a background task (`src/notifications/backgroundCheck.ts`, `expo-background-task`)
  runs about every 15 minutes (the OS decides the exact timing and may stretch it to save battery). It keeps
  running after the app is swiped away and after a reboot on Android. It shows a system notification
  for each new notice (or one summary when more than 3 arrive) and never alerts twice for the same notice.
- Tapping a notification opens the **Alerts** tab. Notification permission is requested after login
  (needed on Android 13+ and iOS).
- **Expo Go vs. development build:** Expo Go (SDK 53+) lacks native parts of `expo-notifications` and the
  background-task modules, so the app skips them there (`src/notifications/nativeModules.ts`). In Expo Go the
  app works and the Alerts tab updates live, but there are no system notifications and no background check.
  For the full behaviour, run a development build: `npx expo run:android` (option 2 in `run-app.bat`).
- Expo Go must match the project's SDK (58). Use `run-app.bat` to start the dev server: it advertises this
  PC's Wi-Fi address (Expo's own detection falls back to 127.0.0.1 on Windows builds without `wmic`).
- Instant alerts while the app is fully closed would need remote push (Firebase Cloud Messaging / APNs via an
  Expo or Firebase account), which is not set up; the background check covers that case with a short delay.

## Project structure

```
App.tsx
src/
  api/            axios client + one file per feature (auth, student, attendance, marks, fees)
  components/     shared UI (Card, TextField, PrimaryButton, state views, etc.)
  context/        AuthContext (session, student profile), NotificationsContext (inbox + live connection)
  notifications/  system notifications, background check task, already-alerted store
  navigation/     AuthStack, bottom-tab MainTabs, RootNavigator
  screens/        one file per screen
  theme/          colors, spacing, typography tokens
  types/          TypeScript interfaces matching the API responses
  config.ts       <- API_BASE_URL lives here
```
