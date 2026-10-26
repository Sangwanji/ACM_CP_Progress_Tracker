# ACM CP Progress Tracker

A web app for tracking progress in our department's competitive programming program. Experts mentor scholars and fellows, assign tasks with deadlines, and review their work. Every member has their own login.

This repository holds the **backend API**. A React frontend will follow.

## Roles

| Role | Who | What they can do |
|---|---|---|
| **Admin** | Club manager (not an expert) | Creates and manages accounts, assigns mentors, deactivates users, resets passwords, views all tasks and progress |
| **Expert** | 3rd year | Creates tasks for their mentees, tracks progress, reviews submissions. May also hold the admin flag (`isAdmin`) |
| **Scholar** | 2nd year | Mentored by one or more experts. Works on assigned tasks |
| **Fellow** | 1st year | Mentored by one or more experts. Works on assigned tasks |

A scholar or fellow can have **several experts**. Mentorship is stored in its own table, so it can be changed at any time without code changes.

## Tech stack

- **Runtime:** Node.js, Express
- **Database:** PostgreSQL on Supabase
- **ORM:** Prisma 6
- **Auth:** email and password (bcrypt), JWT in an httpOnly cookie
- **Validation:** Zod
- **Security:** Helmet, CORS with credentials, login rate limiting, Supabase row-level security enabled on all tables

## Progress

- [x] **Phase 1:** database schema, seed script, login, change password, role middleware
- [x] **Phase 2 (admin side):** admin role, user creation, mentor assignment (many experts per mentee), deactivate and reset password
- [x] **Phase 3:** tasks, assignment to mentees, status updates, expert review and reopen, reviewer tracking
- [ ] **Phase 2 (remaining):** profile endpoints for scholars and fellows, admin delete user
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
   npx prisma migrate dev
   ```
4. Run `prisma/enable_rls.sql` once in the Supabase **SQL Editor**. Supabase exposes public tables through an auto-generated API, and this blocks it. The Express server connects as the database owner, so it is unaffected. Re-run it after adding any new table.
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
- **`Cannot find module`:** check that file names match the `require` paths exactly (`routes/tasks.js`, `routes/assignments.js`, `lib/tasks.js`).

## API reference

All request and response bodies are JSON. Authentication uses an httpOnly cookie named `token`, set on login.

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/health` | Public | Server status |
| POST | `/auth/login` | Public | Log in (limited to 10 attempts per 15 minutes) |
| POST | `/auth/logout` | Anyone | Clear the session cookie |
| GET | `/auth/me` | Logged in | Current user. Scholars and fellows also get `mentors` (id, name, email of each expert) |
| POST | `/auth/change-password` | Logged in | Change password, required on first login |

### Users (admin management)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/users` | Admin, Expert | Admin sees everyone. An expert sees their own mentees |
| POST | `/users` | Admin | Create an account. Returns a one-time temporary password |
| PUT | `/users/:id/mentors` | Admin | Replace the experts of a scholar or fellow (`{ "mentorIds": [2, 3] }`) |
| PATCH | `/users/:id/active` | Admin | Deactivate or reactivate an account (`{ "isActive": false }`) |
| POST | `/users/:id/reset-password` | Admin | Issue a new temporary password |

### Tasks (experts and admins)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/tasks` | Expert | Create a task and assign it to your own active mentees |
| GET | `/tasks` | Expert, Admin | Admin sees all. An expert sees tasks they created or that involve one of their mentees |
| GET | `/tasks/:id` | Expert, Admin | One task with each assignee's progress |
| PATCH | `/tasks/:id` | Creator | Edit title, description, links, difficulty or deadline |
| DELETE | `/tasks/:id` | Creator | Delete a task and all progress on it |
| POST | `/tasks/:id/assign` | Creator | Add more assignees (`{ "assigneeIds": [5, 6] }`) |
| DELETE | `/tasks/:id/assignees/:assigneeId` | Creator | Remove one assignee and their progress |

### Assignments (progress and review)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/assignments/mine` | Scholar, Fellow | My tasks, soonest deadline first, with `overdue` and who assigned each |
| PATCH | `/assignments/:id` | Scholar, Fellow (own) | Set status (`TODO`, `IN_PROGRESS`, `SUBMITTED`), `submissionLink`, `assigneeNote` |
| PATCH | `/assignments/:id/review` | Expert | Give `feedback`, and a `decision` of `DONE` or `REOPEN`. Allowed for an expert of that person, or the task creator |

### Examples

Create a fellow with two experts:
```http
POST /users
{
  "name": "Test Fellow",
  "email": "fellow@example.com",
  "role": "FELLOW",
  "mentorIds": [2, 3]
}
```

Create a task:
```http
POST /tasks
{
  "title": "Two Pointers set 1",
  "description": "Solve 5 problems",
  "problemLinks": ["https://leetcode.com/problems/two-sum/"],
  "difficulty": "Easy",
  "deadline": "2026-12-15T18:00:00.000Z",
  "assigneeIds": [12, 13]
}
```

Submit work (as a scholar or fellow):
```http
PATCH /assignments/7
{ "status": "SUBMITTED", "submissionLink": "https://leetcode.com/submissions/detail/123/" }
```

Review (as an expert):
```http
PATCH /assignments/7/review
{ "decision": "DONE", "feedback": "Nice work" }
```

## How tasks work

- Each assignee has their own row per task, with independent status, submission and feedback.
- **Statuses:** `TODO`, `IN_PROGRESS`, `SUBMITTED`, `DONE`. Submitting requires a submission link.
- **Overdue** is computed when you read the data: the status is `TODO` or `IN_PROGRESS` and the deadline has passed. A submission waiting for review is not overdue.
- Once an assignment is `DONE`, the assignee can't change it. An expert can reopen it, which returns it to `IN_PROGRESS`.
- Any expert of a mentee can review their work. Each review records who gave it and when (`reviewedBy`, `reviewedAt`).
- Experts see only their own mentees' rows on tasks created by other experts. The creator and admins see every assignee.
- Admins who are not experts cannot create tasks.

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
  lib/                prisma.js, token.js, mentorship.js, tasks.js
  middleware/auth.js  Authentication and role checks
  routes/             auth.js, users.js, tasks.js, assignments.js
```

## Data model

- **User:** name, email, password hash, role, admin flag, active flag, forced password change flag
- **Mentorship:** links an expert to a scholar or fellow (many to many)
- **Profile:** one per user, for personal details and coding handles
- **Task:** title, description, problem links, difficulty, deadline, creator
- **TaskAssignment:** one row per person per task, with status, submission link, note, expert feedback, reviewer and review time

## Security notes

- Passwords are hashed with bcrypt. Accounts are created by an admin, so there is no public signup.
- Login errors are generic, so the API does not reveal whether an email exists.
- The user is reloaded from the database on every request, so deactivating an account takes effect immediately.
- Never commit `.env` or `seed-credentials.txt`.
