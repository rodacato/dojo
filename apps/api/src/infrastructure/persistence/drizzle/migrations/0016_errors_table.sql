-- Sprint 020 Part 7 — Error reporting Postgres sink (ADR 017).
--
-- Durable fallback for ErrorReporterPort: every unhandled API error and
-- every web error posted to /errors ends up here, regardless of whether
-- Sentry is reachable or within quota. Retention is 30 days to stay
-- aligned with Sentry free-tier lookback.

CREATE TABLE "errors" (
  "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "source"     VARCHAR(10) NOT NULL,
  "status"     INTEGER,
  "route"      TEXT,
  "method"     VARCHAR(10),
  "message"    TEXT NOT NULL,
  "stack"      TEXT,
  "request_id" UUID,
  "user_id"    UUID,
  "context"    JSONB
);

CREATE INDEX "errors_created_at_idx"    ON "errors" ("created_at" DESC);
CREATE INDEX "errors_source_status_idx" ON "errors" ("source", "status");
