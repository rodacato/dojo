CREATE TABLE IF NOT EXISTS "badge_definitions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" varchar(100) UNIQUE NOT NULL,
  "name" varchar(255) NOT NULL,
  "description" text NOT NULL,
  "category" varchar(50) NOT NULL,
  "is_prestige" boolean NOT NULL DEFAULT false,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "user_badges" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "badge_slug" varchar(100) NOT NULL REFERENCES "badge_definitions"("slug"),
  "session_id" uuid REFERENCES "sessions"("id"),
  "earned_at" timestamp DEFAULT now() NOT NULL
);

-- Seed initial badge definitions
INSERT INTO "badge_definitions" ("slug", "name", "description", "category", "is_prestige") VALUES
  ('FIRST_KATA', 'First Kata', 'Completed your first kata in the dojo.', 'practice', false),
  ('5_STREAK', '5 Day Streak', 'Practiced five consecutive days. The habit is forming.', 'consistency', false)
ON CONFLICT ("slug") DO NOTHING;
