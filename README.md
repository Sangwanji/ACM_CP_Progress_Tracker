# ACM CP Progress Tracker

A web app for tracking progress in our department's competitive programming program. Experts mentor scholars and fellows, assign tasks with deadlines, and review their work. Every member has their own login.

## What it does

- **Experts** (3rd year) create tasks, assign them to their mentees, and review submissions.
- **Scholars** (2nd year) and **fellows** (1st year) see their tasks, update progress, submit links, and read feedback. A scholar or fellow can have more than one expert.
- **Admins** manage accounts and mentor assignments. An admin is not an expert and cannot create tasks, unless the account is also an expert.
- Everyone has a profile with their branch, roll number and LeetCode, Codeforces and CodeChef handles. Scholars and fellows can see each other's profiles, but phone numbers are visible only to the person, their experts and admins.

## Repository layout

```
ACM_CP_Progress_Tracker/
  CPTracker_Backend/     Express and Prisma API (PostgreSQL on Supabase)
  CPTracker_Frontend/    React app (Vite and Tailwind)
```

Each folder has its own README with setup details:

- [Backend README](CPTracker_Backend/README.md)
- [Frontend README](CPTracker_Frontend/README.md)

## Tech stack

| Part | Technology |
|---|---|
| Backend | Node.js, Express, Prisma 6, Zod, JWT in an httpOnly cookie |
| Database | PostgreSQL on Supabase, row-level security enabled |
| Frontend | React 19, Vite, Tailwind CSS 4, React Router, TanStack Query |

## Quick start

You need Node.js 18 or newer and a Supabase project.

1. **Backend** (first terminal):
   ```bash
   cd CPTracker_Backend
   npm install
   cp .env.example .env        # then fill in the values
   npx prisma migrate dev
   npm run db:seed
   npm run dev                 # http://localhost:4000
   ```
   See the backend README for the Supabase connection strings and the one-time RLS script.

2. **Frontend** (second terminal):
   ```bash
   cd CPTracker_Frontend
   npm install
   npm run dev                 # http://localhost:5173
   ```
   The frontend sends API calls to `/api`, and the dev server forwards them to the backend on port 4000.

3. Log in with an account from `seed-credentials.txt` (created by the seed script). Every new account must change its temporary password on first login.

> Some college networks block database ports. If the backend can't reach Supabase, use a mobile hotspot or a local PostgreSQL for development.

## Roadmap

**Backend**
- [x] Login, logout, forced password change, role middleware
- [x] Admin tools: create users, assign several experts to a mentee, deactivate, reset password
- [x] Tasks, assignments, expert review and reopen, reviewer tracking
- [x] Dashboard and profile routes
- [ ] Admin delete user, and add or remove a single expert

**Frontend**
- [x] Foundation: login, forced password change, route protection
- [ ] App shell and the "Verdict" theme
- [ ] Scholar and fellow screens: dashboard, my tasks, profiles
- [ ] Expert screens: mentee overview, review queue, task create and detail
- [ ] Admin screens: users, mentors, activate, reset password

**Documentation**
- [ ] `API.md`: every backend endpoint with its request body and an example response
- [x] Update the backend README for the dashboard and profile endpoints.

**Later**
- [ ] Deployment (backend host plus frontend host, with `/api` forwarded so cookies stay first-party)
- [ ] Email when a task is assigned, and reminders before a deadline
- [ ] Sync solved counts from LeetCode and Codeforces

## Design direction

The interface follows a contest-judge look called "Verdict": dark by default, monospace labels, and task statuses shown as judge verdicts (`In queue`, `Running`, `Judging`, `AC`, `TLE`). Details are in the frontend README.

## Security notes

- Never commit `.env` or `seed-credentials.txt`. Both are in `.gitignore`.
- Accounts are created by an admin, so there is no public signup.
- Passwords are hashed with bcrypt, and login attempts are rate limited.
