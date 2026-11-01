# API Reference

Every endpoint of the ACM CP Progress Tracker backend, with request bodies, rules and response shapes.

## Conventions

- **Base URL:** `http://localhost:4000` in development. The frontend calls the same routes through the `/api` prefix, which the dev server strips.
- **Format:** all request and response bodies are JSON (`Content-Type: application/json`).
- **Authentication:** `POST /auth/login` sets an httpOnly cookie named `token` (valid 7 days). Send it with every request (`credentials: 'include'` in a browser, automatic in Postman).
- **Errors:** every failure returns `{ "error": "message" }`. Some add a `code`.
- **Dates:** ISO 8601 strings in UTC, for example `2026-12-15T18:00:00.000Z`.

### Status codes

| Code | Meaning |
|---|---|
| 200 / 201 | Success / created |
| 400 | Invalid request body or a rule was broken. `error` explains which |
| 401 | Not logged in, expired session, or wrong credentials |
| 403 | Logged in but not allowed (wrong role), or password change required |
| 404 | Not found, or you are not allowed to know it exists |
| 409 | Conflict with the current state (duplicate email, task already done, user still has dependencies) |
| 429 | Too many login attempts |
| 500 | Server error |

### Roles and access labels

| Label | Meaning |
|---|---|
| Public | No login needed |
| Logged in | Any active user |
| Member | Scholar or fellow |
| Expert | Role `EXPERT` |
| Admin | `isAdmin` is true. This is a pure `ADMIN` role, or an expert with the admin flag |
| Creator | The expert who created the task |

### Password gate

A new or reset account has `mustChangePassword: true`. Until the password is changed, every route except `/auth/me`, `/auth/change-password`, `/auth/login` and `/auth/logout` returns:

```json
{ "error": "Password change required", "code": "MUST_CHANGE_PASSWORD" }
```
with status 403.

### Enums

| Name | Values |
|---|---|
| Role | `ADMIN`, `EXPERT`, `SCHOLAR`, `FELLOW` |
| Assignment status | `TODO`, `IN_PROGRESS`, `SUBMITTED`, `DONE` |

**Overdue** is computed on read: the status is `TODO` or `IN_PROGRESS` and the deadline has passed.

**Links** (problem links, submission links) must start with `http://` or `https://`, up to 500 characters.

---

## Health

### GET /health
Access: Public

Response `200`
```json
{ "ok": true }
```

---

## Auth

### POST /auth/login
Access: Public. Limited to 10 attempts per 15 minutes per client.

Body
```json
{ "email": "fellow@example.com", "password": "secret123" }
```
Response `200`, sets the `token` cookie
```json
{
  "user": {
    "id": 12, "name": "Test Fellow", "email": "fellow@example.com",
    "role": "FELLOW", "isAdmin": false, "mustChangePassword": false
  }
}
```
Errors: `400` invalid body, `401 Invalid email or password` (unknown email, wrong password or deactivated account, all with the same message), `429`.

### POST /auth/logout
Access: Anyone. No body. Clears the cookie.

Response `200`: `{ "ok": true }`

### GET /auth/me
Access: Logged in (works during the password gate).

Response `200`
```json
{
  "user": {
    "id": 12, "name": "Test Fellow", "email": "fellow@example.com",
    "role": "FELLOW", "isAdmin": false, "mustChangePassword": false,
    "mentors": [ { "id": 2, "name": "Expert One", "email": "expert1@example.com" } ]
  }
}
```
`mentors` lists the user's active experts. It is empty for experts and admins.

### POST /auth/change-password
Access: Logged in (works during the password gate).

Body
```json
{ "currentPassword": "old-password", "newPassword": "new-password-123" }
```
Rules: `newPassword` has at least 8 characters and differs from `currentPassword`.

Response `200`: `{ "ok": true }`. Also clears `mustChangePassword`.
Errors: `400` (too short, or same as current), `401 Current password is incorrect`.

---

## Users (admin management)

User object returned by these routes:
```json
{
  "id": 12, "name": "Test Fellow", "email": "fellow@example.com",
  "role": "FELLOW", "isAdmin": false, "isActive": true,
  "createdAt": "2026-10-20T10:00:00.000Z", "mentorIds": [2, 3]
}
```

### GET /users
Access: Admin or Expert.

An admin gets everyone. An expert without the admin flag gets only their own mentees. Response `200`
```json
{ "users": [ { "id": 12, "name": "Test Fellow", "...": "..." } ] }
```
Scholars and fellows get `403`. An expert with no mentees gets an empty list.

### POST /users
Access: Admin

Body
```json
{
  "name": "Test Fellow",
  "email": "fellow@example.com",
  "role": "FELLOW",
  "mentorIds": [2, 3]
}
```
| Field | Rules |
|---|---|
| `name` | Required, at least 1 character |
| `email` | Required, valid email, stored in lower case |
| `role` | `ADMIN`, `EXPERT`, `SCHOLAR` or `FELLOW` |
| `isAdmin` | Optional boolean. Only has an effect for `EXPERT`. A `ADMIN` role is always admin |
| `mentorIds` | Required for `SCHOLAR` and `FELLOW`: at least one active expert id. Ignored for other roles |

Response `201`. The temporary password is shown **once**.
```json
{ "user": { "id": 21, "...": "..." }, "temporaryPassword": "k3F9aQzP" }
```
Errors: `400` (invalid fields, or mentors that are not active experts), `409 Email already in use`.

### PUT /users/:id/mentors
Access: Admin. Replaces the full set of experts of a scholar or fellow.

Body
```json
{ "mentorIds": [2, 3] }
```
Rules: at least one id, all active experts. The target must be a scholar or fellow.

Response `200`: `{ "user": { "...": "..." } }`
Errors: `400`.

### PATCH /users/:id/active
Access: Admin

Body
```json
{ "isActive": false }
```
A deactivated user cannot log in, and an existing session stops working. Their history is kept. You cannot deactivate yourself (`400`).

Response `200`: `{ "user": { "...": "..." } }`

### POST /users/:id/reset-password
Access: Admin. No body.

Sets a new temporary password and forces a change on next login.

Response `200`: `{ "temporaryPassword": "k3F9aQzP" }`

### DELETE /users/:id
Access: Admin. Permanently deletes the account, its profile, mentorship links and all of its task progress.

Errors:
| Status | Reason |
|---|---|
| 400 | You cannot delete your own account, or the user is the last admin |
| 404 | User not found |
| 409 | The user created tasks (deactivate instead), or is the only expert of a mentee (reassign first) |

Response `200`: `{ "ok": true }`

---

## Profiles

Profile object:
```json
{
  "userId": 12, "name": "Test Fellow", "email": "fellow@example.com", "role": "FELLOW",
  "year": 1, "branch": "CSE", "rollNo": "25BTEC001",
  "phone": "+91 98765 43210",
  "leetcodeHandle": "saksham_01", "codeforcesHandle": null, "codechefHandle": null,
  "bio": "Loves graphs", "avatarUrl": "https://example.com/me.png",
  "mentors": [ { "id": 2, "name": "Expert One" } ]
}
```
**Phone privacy:** `phone` is included only for the person themselves, their own experts and admins. For everyone else the field is missing.

### GET /profiles
Access: Logged in. Active scholars and fellows. Optional query `?role=SCHOLAR` or `?role=FELLOW`.

Response `200`: `{ "profiles": [ ... ] }`

### GET /profiles/:userId
Access: Logged in. Any active user except pure admin accounts. Deactivated users are visible to admins only.

Response `200`: `{ "profile": { ... } }`. `404` otherwise.

### PATCH /profiles/:userId
Access: The owner, or an admin.

Body (send any of these, at least one)
```json
{
  "year": 2, "branch": "CSE", "rollNo": "25BTEC001", "phone": "+91 98765 43210",
  "leetcodeHandle": "saksham_01", "codeforcesHandle": "saksham", "codechefHandle": "saksham",
  "bio": "Loves graphs", "avatarUrl": "https://example.com/me.png"
}
```
| Field | Rules |
|---|---|
| `year` | Whole number 1 to 5 |
| `branch` | Up to 60 characters |
| `rollNo` | Up to 30 characters |
| `phone` | 7 to 20 characters: digits, spaces, `()` and `-`, optional leading `+` |
| handles | 1 to 40 characters of letters, digits, `_`, `.` or `-` |
| `bio` | Up to 500 characters |
| `avatarUrl` | A link starting with `https://`, up to 500 characters |

An empty string or `null` clears a field.

Response `200`: `{ "profile": { ... } }`
Errors: `400` (validation), `403` (editing someone else's profile without admin), `404`.

---

## Tasks

Task object:
```json
{
  "id": 5, "title": "Two Pointers set 1", "description": "Solve 5 problems",
  "problemLinks": ["https://leetcode.com/problems/two-sum/"],
  "difficulty": "Easy", "deadline": "2026-12-15T18:00:00.000Z",
  "createdAt": "2026-10-20T10:00:00.000Z", "createdById": 2,
  "createdBy": { "id": 2, "name": "Expert One" },
  "assignments": [
    {
      "id": 7,
      "assignee": { "id": 12, "name": "Test Fellow", "role": "FELLOW" },
      "status": "SUBMITTED", "overdue": false,
      "submissionLink": "https://leetcode.com/submissions/detail/123/",
      "assigneeNote": "Used two pointers",
      "expertFeedback": null,
      "reviewedBy": null, "reviewedAt": null,
      "completedAt": null, "updatedAt": "2026-10-21T08:00:00.000Z"
    }
  ]
}
```
**Visibility:** the creator and admins see every assignee. Another expert sees the task only if one of their mentees is on it, and only those mentees' rows.

### POST /tasks
Access: Expert (a pure admin gets `403`). Creates the task and its assignments together.

Body
```json
{
  "title": "Two Pointers set 1",
  "description": "Solve 5 problems",
  "problemLinks": ["https://leetcode.com/problems/two-sum/"],
  "difficulty": "Easy",
  "deadline": "2026-12-15T18:00:00.000Z",
  "assigneeIds": [12, 13]
}
```
| Field | Rules |
|---|---|
| `title` | Required, 1 to 200 characters |
| `description` | Optional, up to 5000 characters |
| `problemLinks` | Optional, up to 20 `http(s)` links |
| `difficulty` | Optional, up to 30 characters (the app uses Easy, Medium, Hard) |
| `deadline` | Required, must be in the future |
| `assigneeIds` | Required, at least one. Each must be one of your own active mentees |

Response `201`: `{ "task": { ... } }`
Errors: `400` (validation, or an assignee who is not your active mentee).

### GET /tasks
Access: Expert or Admin. An admin gets all tasks. An expert gets tasks they created or that involve one of their mentees. Sorted by deadline, soonest first.

Response `200`: `{ "tasks": [ { ... } ] }`

### GET /tasks/:id
Access: Expert or Admin, with the visibility rule above.

Response `200`: `{ "task": { ... } }`. `404` if it doesn't exist or you can't see it.

### PATCH /tasks/:id
Access: Creator only (`403` for other experts).

Body: any of `title`, `description`, `problemLinks`, `difficulty`, `deadline`, with the same rules as creation, except that `deadline` may be in the past.
```json
{ "title": "Two Pointers set 1 (updated)", "deadline": "2026-12-20T18:00:00.000Z" }
```
Response `200`: `{ "task": { ... } }`

### DELETE /tasks/:id
Access: Creator only. Deletes the task and every assignee's progress on it.

Response `200`: `{ "ok": true }`

### POST /tasks/:id/assign
Access: Creator only. Adds more assignees. People already on the task are skipped.

Body
```json
{ "assigneeIds": [14, 15] }
```
Each id must be one of your own active mentees.

Response `200`: `{ "task": { ... } }`

### DELETE /tasks/:id/assignees/:assigneeId
Access: Creator only. Removes one assignee and their progress on this task.

Response `200`: `{ "ok": true }`

---

## Assignments (progress and review)

Assignment object as returned to a member:
```json
{
  "id": 7, "status": "IN_PROGRESS", "overdue": false,
  "submissionLink": null, "assigneeNote": null, "expertFeedback": null,
  "reviewedBy": null, "reviewedAt": null, "completedAt": null,
  "updatedAt": "2026-10-21T08:00:00.000Z",
  "task": {
    "id": 5, "title": "Two Pointers set 1", "description": "Solve 5 problems",
    "problemLinks": ["https://leetcode.com/problems/two-sum/"],
    "difficulty": "Easy", "deadline": "2026-12-15T18:00:00.000Z",
    "createdById": 2, "createdBy": { "id": 2, "name": "Expert One" }
  }
}
```

### GET /assignments/mine
Access: Member. Your tasks, soonest deadline first.

Response `200`: `{ "assignments": [ { ... } ] }`

### PATCH /assignments/:id
Access: Member, only your own assignment (`404` otherwise).

Body (send any, at least one)
```json
{
  "status": "SUBMITTED",
  "submissionLink": "https://leetcode.com/submissions/detail/123/",
  "assigneeNote": "Used two pointers"
}
```
| Field | Rules |
|---|---|
| `status` | `TODO`, `IN_PROGRESS` or `SUBMITTED`. You cannot set `DONE` |
| `submissionLink` | `http(s)` link, or `null` to clear |
| `assigneeNote` | Up to 1000 characters, or `null` to clear |

Rules:
- Submitting (`SUBMITTED`) requires a submission link, either in this request or already saved (`400` otherwise).
- Once an assignment is `DONE`, it is locked (`409`). An expert must reopen it.

Response `200`: `{ "assignment": { ... } }`

### PATCH /assignments/:id/review
Access: Expert who is the task creator or one of the assignee's experts (`403` otherwise).

Body (send either or both)
```json
{ "decision": "DONE", "feedback": "Nice work" }
```
| Field | Rules |
|---|---|
| `decision` | `DONE` marks it accepted. `REOPEN` returns it to `IN_PROGRESS` and clears the completion time. It works on done and submitted work |
| `feedback` | Up to 2000 characters. Replaces the previous feedback |

Every review records who gave it and when (`reviewedBy`, `reviewedAt`).

Response `200`: `{ "assignment": { ... } }`

---

## Dashboard

### GET /dashboard/me
Access: Member.

Response `200`
```json
{
  "stats": {
    "total": 10, "todo": 2, "inProgress": 3, "submitted": 1, "done": 4,
    "overdue": 1, "completionRate": 40, "nextDeadline": "2026-12-15T18:00:00.000Z"
  },
  "overdue": [ { "assignmentId": 7, "taskId": 5, "title": "...", "difficulty": "Easy", "deadline": "...", "status": "TODO" } ],
  "upcoming": [ { "assignmentId": 8, "taskId": 6, "title": "...", "difficulty": "Hard", "deadline": "...", "status": "IN_PROGRESS" } ],
  "awaitingReview": [ { "assignmentId": 9, "taskId": 7, "title": "...", "difficulty": "Medium", "deadline": "...", "status": "SUBMITTED" } ],
  "recentFeedback": [
    { "assignmentId": 3, "title": "...", "feedback": "Nice work",
      "reviewedBy": { "id": 2, "name": "Expert One" }, "reviewedAt": "..." }
  ]
}
```
`upcoming` holds up to 5 open tasks that are not overdue. `completionRate` is done divided by total, as a whole-number percentage.

### GET /dashboard/overview
Access: Expert or Admin. An admin sees every active scholar and fellow. An expert without the admin flag sees their own mentees. Mentees with overdue tasks come first.

Response `200`
```json
{
  "totals": { "total": 40, "todo": 8, "inProgress": 10, "submitted": 4, "done": 18, "overdue": 3, "completionRate": 45 },
  "mentees": [
    {
      "id": 12, "name": "Test Fellow", "email": "fellow@example.com", "role": "FELLOW",
      "mentors": [ { "id": 2, "name": "Expert One" } ],
      "stats": { "total": 5, "todo": 1, "inProgress": 1, "submitted": 1, "done": 2, "overdue": 1,
                 "completionRate": 40, "nextDeadline": "2026-12-15T18:00:00.000Z" }
    }
  ]
}
```

### GET /dashboard/review-queue
Access: Expert. Submissions from your own mentees waiting for review, oldest first.

Response `200`
```json
{
  "count": 1,
  "queue": [
    {
      "assignmentId": 7,
      "assignee": { "id": 12, "name": "Test Fellow", "role": "FELLOW" },
      "task": { "id": 5, "title": "Two Pointers set 1", "deadline": "...",
                "createdBy": { "id": 2, "name": "Expert One" } },
      "submissionLink": "https://leetcode.com/submissions/detail/123/",
      "assigneeNote": "Used two pointers",
      "submittedAt": "2026-12-14T20:00:00.000Z",
      "late": false
    }
  ]
}
```
`submittedAt` is the last update time of the assignment. `late` is true when it was submitted after the deadline.
