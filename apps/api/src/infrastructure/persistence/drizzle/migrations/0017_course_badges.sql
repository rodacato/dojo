-- Sprint 020 Part 2.3 — Course completion badges.
--
-- One definition per currently-shipping course. New courses add a row here
-- in a future migration and a slug mapping in BadgeEventHandler.ts.

INSERT INTO "badge_definitions" ("slug", "name", "description", "category", "is_prestige") VALUES
  ('COURSE_TYPESCRIPT_FUNDAMENTALS', 'TypeScript Fundamentals', 'Completed every step of the TypeScript Fundamentals course.', 'mastery', false),
  ('COURSE_JAVASCRIPT_DOM_FUNDAMENTALS', 'DOM Wrangler', 'Completed every step of the JavaScript DOM Fundamentals course.', 'mastery', false),
  ('COURSE_SQL_DEEP_CUTS', 'SQL Deep Cuts', 'Completed every step of the SQL Deep Cuts course.', 'mastery', false)
ON CONFLICT ("slug") DO NOTHING;
