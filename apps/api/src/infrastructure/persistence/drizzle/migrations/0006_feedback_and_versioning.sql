-- Kata feedback table
CREATE TABLE IF NOT EXISTS kata_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL UNIQUE REFERENCES sessions(id),
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  variation_id UUID NOT NULL REFERENCES variations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  clarity VARCHAR(20),
  timing VARCHAR(20),
  evaluation VARCHAR(30),
  note TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
-- Exercise versioning and admin notes
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS admin_notes TEXT;
--> statement-breakpoint
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
