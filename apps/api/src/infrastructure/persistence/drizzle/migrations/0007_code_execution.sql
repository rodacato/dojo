-- Code execution support
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS test_code TEXT;
--> statement-breakpoint
ALTER TABLE attempts ADD COLUMN IF NOT EXISTS execution_result JSONB;
