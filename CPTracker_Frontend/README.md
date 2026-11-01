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
- Server data lives in React Query. Hooks and mutations are in `src/lib/queries.js`, and mutations invalidate the related queries so screens refresh themselves.

Endpoint details are in [API.md](../API.md).

## Authentication flow

1. On load, `AuthContext` calls `GET /auth/me`. A valid cookie restores the session; otherwise the user is logged out.
2. After login, the full user (with experts) is loaded from `/auth/me`. A user with `mustChangePassword` is sent to `/change-password` and cannot open any other page until they change it.
3. `ProtectedRoute` guards pages. It accepts `roles={['EXPERT']}` for role-specific pages and `adminOnly` for pages that need the admin flag.
4. These checks only decide what to show. The backend enforces permissions on every request.

## Screens

| Path | Who | Screen |
|---|---|---|
| `/login` | Public | Login |
| `/change-password` | Logged in | Forced password change for temporary passwords |
| `/` | Everyone | Dashboard: progress and deadlines for scholars and fellows, mentee overview and review banner for experts and admins |
| `/tasks` | Everyone | Scholars and fellows: My tasks. Experts and admins: task list with progress |
| `/tasks/:id` | Everyone | Scholars and fellows: task detail with status, submission and feedback. Experts and admins: assignee progress and review |
| `/tasks/new` | Experts | Create a task and pick assignees |
| `/tasks/:id/edit` | Task creator | Edit a task |
| `/review` | Experts | Review queue |
| `/members` | Everyone | Directory of scholars and fellows |
| `/members/:userId` | Everyone | One profile |
| `/profile` | Everyone | Edit your profile and change your password |
| `/admin/users` | Admins | User list with filters and search |
| `/admin/users/new` | Admins | Create an account and see its temporary password once |
| `/admin/users/:id` | Admins | Change experts, deactivate, reset password, delete |

## Project structure

```
src/
  main.jsx               Providers: React Query, Router, Auth
  App.jsx                Route table
  index.css              Tailwind import and theme tokens
  lib/
    api.js               Fetch helper and ApiError
    queries.js           React Query hooks and mutations
    format.js            Dates, countdown spans, safe links
    useNow.js            Clock tick for countdowns
  auth/
    AuthContext.jsx      Current user, login, logout, refresh
    ProtectedRoute.jsx   Route guard (login, password change, roles)
  components/            Layout, ui, StatusBadge, Countdown, Avatar, HandleChips,
                         ExternalLink, ReviewForm, AddAssignees, Badges,
                         ExpertPicker, TempPassword, ChangePasswordCard
  pages/                 One file per screen (see the table above)
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

Fonts: JetBrains Mono for labels, badges and numbers; Inter for body text. Colors are theme tokens in `src/index.css`, and verdict labels live in `StatusBadge.jsx`, so a redesign touches few files.

## Conventions

- Fetch server data with React Query and the `api()` helper. Keep component state for form input only.
- Render user-provided links with `ExternalLink`, which only allows `http(s)` URLs.
- Never put secrets in the frontend. Only variables prefixed with `VITE_` are exposed to the browser, and nothing sensitive should use that prefix.
- Don't trust role checks in the browser. Treat them as navigation hints.

## Troubleshooting

- **"Failed to fetch" or a proxy error in the terminal:** the backend isn't running on port 4000.
- **Login works but the next request returns 401:** the request skipped the `/api` prefix or `credentials: 'include'`, so the cookie wasn't sent. Use the `api()` helper.
- **Backend can't reach the database:** your network may block database ports. Use a mobile hotspot.
- **Redirected to `/change-password`:** the account still has a temporary password. Change it to continue.