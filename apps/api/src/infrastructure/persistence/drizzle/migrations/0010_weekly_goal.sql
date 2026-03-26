-- Weekly goal target in user preferences
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS goal_weekly_target INTEGER NOT NULL DEFAULT 3;
