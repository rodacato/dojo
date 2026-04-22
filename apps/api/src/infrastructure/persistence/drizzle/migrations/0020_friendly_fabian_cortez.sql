-- Sprint 022 Part 4 — Playground v0 (PRD 029, spec 027 §4.2).
--
-- Abuse-detection log only. No source code, no stdout/stderr, no user
-- id. Hashes keep ip + session opaque while still enabling burst
-- detection and rate-limit enforcement. Purged at 30 days by the
-- same cron pattern as the `errors` table.

CREATE TABLE IF NOT EXISTS "playground_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"ip_hash" text NOT NULL,
	"session_hash" text NOT NULL,
	"language" text NOT NULL,
	"version" text NOT NULL,
	"exit_code" integer,
	"runtime_ms" integer
);

-- (ip_hash, created_at DESC) covers the per-IP rate-limit window query
-- and burst-detection rollups.
CREATE INDEX "playground_runs_ip_hash_created_at_idx" ON "playground_runs" ("ip_hash", "created_at" DESC);

-- (session_hash, created_at DESC) covers the per-browser-session rate-limit
-- window — the second layer that makes IP rotation harder.
CREATE INDEX "playground_runs_session_hash_created_at_idx" ON "playground_runs" ("session_hash", "created_at" DESC);

-- (created_at) supports the 30-day purge and the global-daily-quota query
-- (counting today's runs regardless of ip/session).
CREATE INDEX "playground_runs_created_at_idx" ON "playground_runs" ("created_at");
