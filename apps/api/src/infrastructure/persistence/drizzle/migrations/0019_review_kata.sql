-- Sprint 020 Part 4.2 — Code Review kata format (PRD 027).
--
-- Additive: a nullable rubric column on exercises. The new `'review'` enum
-- value for exercises.type is enforced at the Zod schema layer, not the DB,
-- so no enum alter is needed — exercises.type is a varchar here.
-- Rollback = DROP COLUMN "rubric".

ALTER TABLE "exercises" ADD COLUMN "rubric" JSONB;
