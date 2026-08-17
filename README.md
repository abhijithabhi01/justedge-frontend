# JustEdge frontend

React/Vite frontend for the JustEdge IoT monitoring platform.

## Running locally

```bash
npm install
npm run dev
```

The frontend calls `http://localhost:4000` by default. To target another
server, set `VITE_API_URL` before starting Vite.

```bash
$env:VITE_API_URL = 'https://api.example.com'
npm run dev
```

## API integration

All application data and mutations use the server project API:

- `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`
- `/api/board-catalog`, `/api/devices`, `/api/users`
- `/api/alerts`, `/api/automations`, `/api/billing`
- `/api/admins`, `/api/activity-logs`, `/api/oversight` for Superadmins

The browser retains only the signed-in JWT session under `hearth-session-v2`.
It is validated with `/api/auth/me` on startup. There is no seed JSON or
browser-side application-data store.

## Build

```bash
npm run build
```
