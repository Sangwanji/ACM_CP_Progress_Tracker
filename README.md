# ACM CP Tracker: Server (Phase 1)

## Setup
1. Create a Supabase project. In Project Settings -> Database copy the pooled (6543) and direct (5432) connection strings.
2. `cp .env.example .env` and fill in `DATABASE_URL`, `DIRECT_URL` and a long random `JWT_SECRET`
   (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).
3. `npm install`
4. Edit the user lists at the top of `prisma/seed.js` with real names and emails.
5. `npx prisma migrate dev --name init`
6. Run `prisma/enable_rls.sql` in the Supabase SQL Editor (blocks public API access to your tables)
7. `npm run db:seed`  (writes `seed-credentials.txt` with temporary passwords)
8. `npm run dev`

## Quick test
```
curl -i -c jar.txt -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"<temp password>"}' \
  http://localhost:4000/auth/login

curl -b jar.txt http://localhost:4000/users          # 403 until password is changed
curl -b jar.txt -H "Content-Type: application/json" \
  -d '{"currentPassword":"<temp>","newPassword":"MyNewPass123"}' \
  http://localhost:4000/auth/change-password
curl -b jar.txt http://localhost:4000/users          # now works
```
