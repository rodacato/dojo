CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  language VARCHAR(50) NOT NULL,
  accent_color VARCHAR(20) NOT NULL DEFAULT '#6366F1',
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id),
  "order" INTEGER NOT NULL,
  title VARCHAR(500) NOT NULL
);

CREATE TABLE IF NOT EXISTS steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id),
  "order" INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'exercise',
  instruction TEXT NOT NULL,
  starter_code TEXT,
  test_code TEXT,
  hint TEXT
);

CREATE TABLE IF NOT EXISTS course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  completed_steps JSONB NOT NULL DEFAULT '[]',
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS lessons_course_id_order_idx ON lessons(course_id, "order");
CREATE INDEX IF NOT EXISTS steps_lesson_id_order_idx ON steps(lesson_id, "order");
CREATE INDEX IF NOT EXISTS course_progress_user_course_idx ON course_progress(user_id, course_id);
