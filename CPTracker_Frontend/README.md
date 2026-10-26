# ACM CP Tracker: Frontend

The React app for the ACM CP Progress Tracker. It talks to the API in `../CPTracker_Backend`.

## Stack

- React 19 and Vite
- Tailwind CSS 4 (via the `@tailwindcss/vite` plugin)
- React Router 7
- TanStack Query (server data)
- Oxlint (linting)

## Getting started

1. Start the backend first (see its README). It must be running on `http://localhost:4000`.
2. Install and run:
   ```bash
   npm install
   npm run dev
   ```
3. Open `http://localhost:5173`.

### Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run Oxlint |

## How API calls work

All requests go through the helper in `src/lib/api.js`:

```js
const { user } = await api('/auth/login', { method: 'POST', body: { email, password } });
```

- Every path is prefixed with `/api`, and requests are sent with `credentials: 'include'` so the login cookie travels with them.
- In development, `vite.config.js` forwards `/api/*` to `http://localhost:4000` and strips the `/api` prefix. The browser only ever talks to one origin, so the httpOnly login cookie works without CORS or cross-site cookie problems.
- Failed requests throw an `ApiError` with `message`, `status` and an optional `code` (for example `MUST_CHANGE_PASSWORD`).
- **In production** the same rule applies: serve the frontend and forward `/api/*` to the backend from the same domain, otherwise some browsers will block the login cookie.

## Authentication flow

1. On load, `AuthContext` calls `GET /auth/me`. A valid cookie restores the session; otherwise the user is logged out.
2. After login, a user with `mustChangePassword` is sent to `/change-password` and cannot open any other page until they change it.
3. `ProtectedRoute` guards pages. It accepts `roles={['EXPERT']}` for role-specific pages and `adminOnly` for pages that need the admin flag.
4. These checks only decide what to show. The backend enforces permissions on every request.

## Routes

| Path | Access | Page |
|---|---|---|
| `/login` | Public | Login |
| `/change-password` | Logged in | Change password (forced on first login) |
| `/` | Logged in | Home (placeholder, replaced by role dashboards) |

Planned: dashboards, my tasks, task manager, review queue, profiles, and admin user management.

## Project structure

```
src/
  main.jsx               Providers: React Query, Router, Auth
  App.jsx                Route table
  index.css              Tailwind import and theme tokens
  lib/api.js             Fetch helper and ApiError
  auth/
    AuthContext.jsx      Current user, login, logout, refresh
    ProtectedRoute.jsx   Route guard (login, password change, roles)
  pages/
    Login.jsx
    ChangePassword.jsx
    Home.jsx
```

## Design direction: "Verdict"

A contest-judge look: dark by default, monospace labels, and task statuses shown as judge verdicts.

| Task state | Label | Color |
|---|---|---|
| To do | `In queue` | gray |
| In progress | `Running` | blue |
| Submitted | `Judging` | amber |
| Done | `AC` | green |
| Overdue | `TLE` | red |

Difficulty uses green, amber and red for Easy, Medium and Hard.

| Token | Value |
|---|---|
| Background | `#0d1117` |
| Card | `#161b22` |
| Border | `#30363d` |
| Text | `#e6edf3` |
| Accent (ACM blue) | `#0085CA` |

Fonts: JetBrains Mono for labels, badges and numbers; Inter for body text.

This direction may change. Keep colors and labels in one place (theme tokens and a shared status component) so a redesign touches few files.

## Conventions

- Fetch server data with React Query and the `api()` helper. Keep component state for form input only.
- Never put secrets in the frontend. Only variables prefixed with `VITE_` are exposed to the browser, and nothing sensitive should use that prefix.
- Don't trust role checks in the browser. Treat them as navigation hints.

## Troubleshooting

- **"Failed to fetch" or a proxy error in the terminal:** the backend isn't running on port 4000.
- **Login works but the next request returns 401:** the request skipped the `/api` prefix or `credentials: 'include'`, so the cookie wasn't sent. Use the `api()` helper.
- **Backend can't reach the database:** your network may block database ports. Use a mobile hotspot.
- **Redirected to `/change-password`:** the account still has a temporary password. Change it to continue.
