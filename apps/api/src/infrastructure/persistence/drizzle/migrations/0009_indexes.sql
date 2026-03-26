-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS sessions_user_id_status_idx ON sessions(user_id, status);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS sessions_user_id_started_at_idx ON sessions(user_id, started_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS attempts_session_id_submitted_at_idx ON attempts(session_id, submitted_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS exercises_status_idx ON exercises(status);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS kata_feedback_exercise_id_idx ON kata_feedback(exercise_id);
