# Reload app and test API

## How to reload the app

- **Metro terminal (where `npm run start` runs):** press **`r`** to reload the app.
- **iOS Simulator:** press **`Cmd + R`** or use menu Device → Reload.
- **Android Emulator:** press **`R`** twice (double-tap R) or **`Cmd + M`** (Mac) / **`Ctrl + M`** (Windows) → choose "Reload".
- **Physical device:** shake the device to open the dev menu → tap **Reload**.
- **Clear cache and restart:** run `npx expo start -c` (clears Metro cache and starts fresh).

## Test API from the app (dev only)

1. Start the backend (e.g. `cd backend && docker compose up`).
2. Start the app (`npm run start`), then open on simulator/emulator/device.
3. Go to the **Login** screen.
4. In development you’ll see a gray **Test API** box with:
   - **API:** shows the base URL the app is using.
   - **Ping health** – calls `GET /app/health`. Use this to confirm the backend is reachable.
   - **Send dummy OTP** – calls `POST /app/send-otp` with phone `9876543210`.
5. Tap a button and check:
   - **In the app:** result text under the buttons and an alert (success or error).
   - **In Metro:** `[API] Request` / `[API] Response` (or error).
   - **In backend terminal:** `[BACKEND] GET /app/health` or `[BACKEND] POST /app/send-otp`.

If **Ping health** works, the app can reach the backend. If you see no `[BACKEND]` lines, the request isn’t reaching the server (wrong URL, firewall, or backend not running).
