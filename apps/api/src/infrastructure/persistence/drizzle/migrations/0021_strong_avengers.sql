-- Sprint 022 Part 5 — ask-sensei v1 cost / quota log (PRD 029 v1).
-- Lightweight: who, when, model, tokens. Question + answer text are
-- NOT persisted; the surface is free exploration, not graded practice.

CREATE TABLE IF NOT EXISTS "llm_requests_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"asked_at" timestamp DEFAULT now() NOT NULL,
	"model" text NOT NULL,
	"input_tokens" integer,
	"output_tokens" integer
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "llm_requests_log" ADD CONSTRAINT "llm_requests_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
-- (user_id, asked_at DESC) covers the per-user daily quota lookup.
CREATE INDEX "llm_requests_log_user_id_asked_at_idx" ON "llm_requests_log" ("user_id", "asked_at" DESC);
--> statement-breakpoint
-- (asked_at) supports a future global cost rollup independent of user.
CREATE INDEX "llm_requests_log_asked_at_idx" ON "llm_requests_log" ("asked_at");
