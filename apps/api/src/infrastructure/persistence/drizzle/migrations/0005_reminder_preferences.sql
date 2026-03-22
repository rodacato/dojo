ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reminder_enabled" boolean NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reminder_hour" integer NOT NULL DEFAULT 9;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" varchar(255);
