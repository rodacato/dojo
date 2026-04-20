-- Sprint 020 Part 4.1 — "Ask the sensei" nudge log (PRD 026).
--
-- Every nudge request + response is logged so Yemi / Hiroshi can review the
-- prompt quality without shoulder-surfing. user_id is nullable because
-- public courses serve anonymous learners; feedback is null until the user
-- clicks thumbs up / down inline on the nudge card.

CREATE TABLE "step_nudges" (
  "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "user_id"    UUID REFERENCES "users"("id"),
  "step_id"    UUID NOT NULL REFERENCES "steps"("id"),
  "prompt"     TEXT NOT NULL,
  "response"   TEXT NOT NULL,
  "feedback"   VARCHAR(8)
);

CREATE INDEX "step_nudges_created_at_idx" ON "step_nudges" ("created_at" DESC);
CREATE INDEX "step_nudges_step_id_idx"    ON "step_nudges" ("step_id");
