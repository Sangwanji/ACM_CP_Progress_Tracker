-- Run once in the Supabase SQL Editor AFTER `prisma migrate`.
-- Supabase exposes every public table through an auto-generated REST API that
-- anyone holding the anon key can call. Enabling RLS with no policies blocks that
-- access completely. Your Express server connects as the database owner through
-- Prisma, which bypasses RLS, so the app keeps working.
ALTER TABLE "User"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Profile"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TaskAssignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Mentorship" ENABLE ROW LEVEL SECURITY;