-- Sprint 019 — Course content quality v2 (pedagogy)
--
-- courses.external_references: JSON array of {title, url, kind} per framework §8.
-- steps.alternative_approach:  post-pass markdown for a second idiomatic approach.

ALTER TABLE "courses" ADD COLUMN "external_references" JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "steps"   ADD COLUMN "alternative_approach" TEXT;
