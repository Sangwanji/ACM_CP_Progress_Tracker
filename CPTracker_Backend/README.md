# ACM CP Progress Tracker: Backend

The API for the ACM CP Progress Tracker. Experts mentor scholars and fellows, assign tasks with deadlines, and review their work. Every member has their own login.

The full list of endpoints with request bodies is in [API.md](../API.md).

## Roles

| Role | Who | What they can do |
|---|---|---|
| **Admin** | Club manager (not an expert) | Creates and manages accounts, assigns mentors, deactivates, deletes and resets passwords, views all tasks, progress and profiles |
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
- **Security:** Helmet, CORS with credentials, login rate limiting, http(s)-only links, Supabase row-level security enabled on all tables

## Progress

- [x] Login, logout, forced password change, change password, role middleware
- [x] Admin tools: create, mentors, deactivate, reset password, delete (with safety checks)
- [x] Profiles with phone privacy
- [x] Tasks, assignments, expert review and reopen, reviewer tracking
- [x] Dashboards for members and experts, review queue
- [x] API reference ([API.md](../API.md))
- [ ] Email on task assignment, deadline reminders
- [ ] Solved-count sync from LeetCode and Codeforces

## Getting started

### Prerequisites
- Node.js 18 or newer
- A Supabase project (free tier is fine)

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill it in (see the table below).
3. Create the tables:
   ```bash
   npx prisma migrate dev
   ```
4. Run `prisma/enable_rls.sql` once in the Supabase **SQL Editor**. Supabase exposes public tables through an auto-generated API, and this blocks it. The Express server connects as the database owner, so it is unaffected. Re-run it after adding any new table.
5. Edit the user lists at the top of `prisma/seed.js`, then seed:
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

### Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the server with auto-restart |
| `npm start` | Start the server |
| `npm run db:seed` | Create the seed users |
| `npm run db:migrate` | Run `prisma migrate dev` |
| `npm run db:deploy` | Apply migrations in production |
| `npm run db:studio` | Open Prisma Studio |

### Troubleshooting
- **"Can't reach database server":** some college and office networks block database ports. Use a mobile hotspot or a local PostgreSQL for development.
- **`403 MUST_CHANGE_PASSWORD`:** every account starts with a temporary password. Call `POST /auth/change-password` first.
- **`Cannot find module`:** check that file names match the `require` paths exactly (`routes/tasks.js`, `routes/assignments.js`, `lib/tasks.js`).
- **Prisma errors after a version change:** keep `prisma` and `@prisma/client` on the same major version (6.x).

## Endpoints at a glance

All request and response bodies are JSON. Authentication uses an httpOnly cookie named `token`, set on login. Bodies, rules and response shapes are in [API.md](../API.md).

| Area | Endpoints |
|---|---|
| Auth | `GET /health`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/change-password` |
| Users (admin) | `GET /users`, `POST /users`, `PUT /users/:id/mentors`, `PATCH /users/:id/active`, `POST /users/:id/reset-password`, `DELETE /users/:id` |
| Profiles | `GET /profiles`, `GET /profiles/:userId`, `PATCH /profiles/:userId` |
| Tasks (experts, admins) | `POST /tasks`, `GET /tasks`, `GET /tasks/:id`, `PATCH /tasks/:id`, `DELETE /tasks/:id`, `POST /tasks/:id/assign`, `DELETE /tasks/:id/assignees/:assigneeId` |
| Assignments | `GET /assignments/mine`, `PATCH /assignments/:id`, `PATCH /assignments/:id/review` |
| Dashboard | `GET /dashboard/me`, `GET /dashboard/overview`, `GET /dashboard/review-queue` |

**Phone privacy:** a phone number is returned only to the person themselves, their own experts and admins. Everyone else gets the profile without the `phone` field.

## How tasks work

- Each assignee has their own row per task, with independent status, submission and feedback.
- **Statuses:** `TODO`, `IN_PROGRESS`, `SUBMITTED`, `DONE`. Submitting requires a submission link.
- **Overdue** is computed when you read the data: the status is `TODO` or `IN_PROGRESS` and the deadline has passed. A submission waiting for review is not overdue.
- Once an assignment is `DONE`, the assignee can't change it. An expert can reopen it, which returns it to `IN_PROGRESS`.
- Any expert of a mentee can review their work, and so can the task's creator. Each review records who gave it and when (`reviewedBy`, `reviewedAt`).
- Only the creator can edit or delete a task, and add or remove assignees. Other experts keep review access.
- Experts see only their own mentees' rows on tasks created by other experts. The creator and admins see every assignee.
- Admins who are not experts cannot create tasks.
- **Completion rate** on the dashboards is done assignments divided by all assignments, as a whole-number percentage.

## Deleting versus deactivating users

- **Deactivate** blocks login and keeps all history. Use it for people who leave the program.
- **Delete** removes the account and all of its progress. It is refused for the last admin, for yourself, for experts who created tasks, and for experts who are a mentee's only expert.

## Project structure

```
prisma/
  schema.prisma       Database models
  seed.js             Creates the initial users with temporary passwords
  enable_rls.sql      Row-level security for Supabase
  migrations/
src/
  app.js              Express app setup and route registration
  server.js           Entry point
  lib/                prisma.js, token.js, mentorship.js, tasks.js, stats.js, validators.js
  middleware/auth.js  Authentication and role checks
  routes/             auth.js, users.js, tasks.js, assignments.js, dashboard.js, profiles.js
```

## Data model

- **User:** name, email, password hash, role, admin flag, active flag, forced password change flag
- **Mentorship:** links an expert to a scholar or fellow (many to many)
- **Profile:** one per user, with year, branch, roll number, phone, coding handles, bio and avatar link
- **Task:** title, description, problem links, difficulty, deadline, creator
- **TaskAssignment:** one row per person per task, with status, submission link, note, expert feedback, reviewer and review time

## Security notes

- Passwords are hashed with bcrypt. Accounts are created by an admin, so there is no public signup.
- Login errors are generic, so the API does not reveal whether an email exists.
- The user is reloaded from the database on every request, so deactivating an account takes effect immediately.
- Tokens are stateless: changing a password does not sign out other devices until their token expires.
- Never commit `.env` or `seed-credentials.txt`.