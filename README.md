# ACM CP Progress Tracker

A web app for tracking progress in our department's competitive programming program. Experts mentor scholars and fellows, assign tasks with deadlines, and review their work. Every member has their own login.

This repository holds the **backend API**. A React frontend will follow.

## Roles

| Role | Who | What they can do |
|---|---|---|
| **Admin** | Club manager (not an expert) | Creates and manages accounts, assigns mentors, deactivates users, resets passwords |
| **Expert** | 3rd year | Sees their own mentees. May also hold the admin flag (`isAdmin`) |
| **Scholar** | 2nd year | Mentored by one or more experts |
| **Fellow** | 1st year | Mentored by one or more experts |

A scholar or fellow can have **several experts**. Mentorship is stored in its own table, so it can be changed at any time without code changes.

## Tech stack

- **Runtime:** Node.js, Express
- **Database:** PostgreSQL on Supabase
- **ORM:** Prisma
- **Auth:** email and password (bcrypt), JWT in an httpOnly cookie
- **Validation:** Zod
- **Security:** Helmet, CORS with credentials, login rate limiting, Supabase row-level security enabled on all tables

## Progress

- [x] **Phase 1:** database schema, seed script, login, change password, role middleware
- [x] **Phase 2 (admin side):** admin role, user creation, mentor assignment (many experts per mentee), deactivate and reset password
- [ ] **Phase 2 (remaining):** profile endpoints for scholars and fellows
- [ ] **Phase 3:** tasks, assignment to mentees, status updates, expert review
- [ ] **Phase 4:** dashboard statistics
- [ ] **Later:** email on task assignment, deadline reminders, solved-count sync from LeetCode and Codeforces

## Getting started

### Prerequisites
- Node.js 18 or newer
- A Supabase project (free tier is fine)

### Setup

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill it in (see the table below).
3. Create the tables:
   ```bash
   npx prisma migrate dev --name init
   ```
4. Run `prisma/enable_rls.sql` once in the Supabase **SQL Editor**. Supabase exposes public tables through an auto-generated API, and this blocks it. The Express server connects as the database owner, so it is unaffected.
5. Edit the user lists at the top of `prisma/seed.js` with real names and emails, then seed:
   ```bash
   npm run db:seed
   ```
   Temporary passwords are written to `seed-credentials.txt`. Share them privately and delete the file afterwards.
6. Start the server:
   ```bash
   npm run dev
   ```
   The API runs on `http://localhost:4000`. Check `GET /health`.

### Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase transaction pooler connection string (port 6543, used by the app) |
| `DIRECT_URL` | Supabase session or direct connection string (port 5432, used by migrations) |
| `JWT_SECRET` | Long random string for signing tokens |
| `JWT_EXPIRES_IN` | Token lifetime, for example `7d` |
| `CLIENT_URL` | Exact origin of the frontend, used for CORS |
| `PORT` | Server port, default `4000` |
| `NODE_ENV` | `development` or `production` |

Generate a secret with:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Troubleshooting
- **"Can't reach database server":** some college and office networks block database ports. Use a mobile hotspot or a local PostgreSQL for development.
- **`403 MUST_CHANGE_PASSWORD`:** every account starts with a temporary password. Call `POST /auth/change-password` first.

## API reference (phases 1 and 2)

All request and response bodies are JSON. Authentication uses an httpOnly cookie named `token`, set on login.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/health` | Public | Server status |
| POST | `/auth/login` | Public | Log in (limited to 10 attempts per 15 minutes) |
| POST | `/auth/logout` | Anyone | Clear the session cookie |
| GET | `/auth/me` | Logged in | Current user |
| POST | `/auth/change-password` | Logged in | Change password, required on first login |
| GET | `/users` | Admin, Expert | Admin sees everyone. An expert sees their own mentees |
| POST | `/users` | Admin | Create an account. Returns a one-time temporary password |
| PUT | `/users/:id/mentors` | Admin | Replace the experts of a scholar or fellow (`{ "mentorIds": [2, 3] }`) |
| PATCH | `/users/:id/active` | Admin | Deactivate or reactivate an account (`{ "isActive": false }`) |
| POST | `/users/:id/reset-password` | Admin | Issue a new temporary password |

### Example: create a fellow with two experts

```http
POST /users
{
  "name": "Test Fellow",
  "email": "fellow@example.com",
  "role": "FELLOW",
  "mentorIds": [2, 3]
}
```

## Project structure

```
prisma/
  schema.prisma       Database models
  seed.js             Creates the initial users with temporary passwords
  enable_rls.sql      Row-level security for Supabase
  migrations/
src/
  app.js              Express app setup
  server.js           Entry point
  lib/                Prisma client, token helpers, mentorship helpers
  middleware/auth.js  Authentication and role checks
  routes/             auth.js, users.js
```

## Data model

- **User:** name, email, password hash, role, admin flag, active flag, forced password change flag
- **Mentorship:** links an expert to a scholar or fellow (many to many)
- **Profile:** one per user, for personal details and coding handles
- **Task** and **TaskAssignment:** tasks with deadlines, and one progress row per assignee (used from phase 3)

## Security notes

- Passwords are hashed with bcrypt. Accounts are created by an admin, so there is no public signup.
- Login errors are generic, so the API does not reveal whether an email exists.
- The user is reloaded from the database on every request, so deactivating an account takes effect immediately.
- Never commit `.env` or `seed-credentials.txt`.
