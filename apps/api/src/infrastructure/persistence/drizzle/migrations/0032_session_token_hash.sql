ALTER TABLE "user_sessions" ADD COLUMN "token_hash" text;--> statement-breakpoint
UPDATE "user_sessions" SET "token_hash" = encode(sha256(convert_to("id"::text, 'UTF8')), 'hex');--> statement-breakpoint
ALTER TABLE "user_sessions" ALTER COLUMN "token_hash" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_token_hash_unique" UNIQUE("token_hash");
