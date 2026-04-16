-- Sprint 018 Part 1 — Course content quality v1
--
-- step.title: real top-level field (was extracted from instruction H1 by regex)
-- step.solution: reference implementation (hidden from learners until they pass)
-- type default: 'challenge' was Sprint 017's normalization default; now that
--   the framework distinguishes exercise (warmup) vs challenge (stretch),
--   'exercise' is the saner default for new rows.
ALTER TABLE "steps" ADD COLUMN "title" TEXT;
ALTER TABLE "steps" ADD COLUMN "solution" TEXT;
ALTER TABLE "steps" ALTER COLUMN "type" SET DEFAULT 'exercise';
