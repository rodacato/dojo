-- Part 2 — Public courses + anonymous progress
ALTER TABLE "courses" ADD COLUMN "is_public" BOOLEAN NOT NULL DEFAULT false;

-- Make user_id nullable is already the case (no NOT NULL in 0011),
-- but drop the old composite UNIQUE so we can use partial unique indexes
-- that correctly distinguish (user_id) vs (anonymous_session_id) ownership.
ALTER TABLE "course_progress" DROP CONSTRAINT IF EXISTS "course_progress_user_id_course_id_key";
ALTER TABLE "course_progress" DROP CONSTRAINT IF EXISTS "course_progress_user_id_course_id_unique";

ALTER TABLE "course_progress" ADD COLUMN "anonymous_session_id" TEXT;

ALTER TABLE "course_progress" ADD CONSTRAINT "course_progress_owner_chk"
  CHECK (
    (user_id IS NOT NULL AND anonymous_session_id IS NULL)
    OR
    (user_id IS NULL AND anonymous_session_id IS NOT NULL)
  );

CREATE UNIQUE INDEX IF NOT EXISTS "course_progress_user_course_uniq"
  ON "course_progress" (user_id, course_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "course_progress_anon_course_uniq"
  ON "course_progress" (anonymous_session_id, course_id)
  WHERE anonymous_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS "course_progress_anon_idx"
  ON "course_progress" (anonymous_session_id)
  WHERE anonymous_session_id IS NOT NULL;

-- Normalize step types to the CODE_SCHOOL_PLAN convention (read | code | challenge).
-- Existing "exercise" steps all have testCode, so they map to "challenge".
UPDATE "steps" SET "type" = 'read' WHERE "type" = 'explanation';
UPDATE "steps" SET "type" = 'challenge' WHERE "type" = 'exercise';

ALTER TABLE "steps" ALTER COLUMN "type" SET DEFAULT 'challenge';
