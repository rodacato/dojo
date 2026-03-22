INSERT INTO "badge_definitions" ("slug", "name", "description", "category", "is_prestige") VALUES
  ('POLYGLOT', 'Polyglot', 'Completed kata across all three types: CODE, CHAT, and WHITEBOARD.', 'mastery', false),
  ('ARCHITECT', 'Architect', 'Completed three or more WHITEBOARD kata. You think in systems.', 'mastery', false),
  ('BRUTAL_TRUTH', 'Brutal Truth', 'Received NEEDS WORK three times. You keep showing up anyway.', 'practice', false),
  ('CONSISTENT', 'Consistent', 'Thirty consecutive days of practice. The habit is permanent.', 'consistency', true),
  ('UNDEFINED_NO_MORE', 'Undefined No More', 'Completed fifty kata. You are no longer undefined.', 'mastery', true),
  ('SENSEI_APPROVED', 'Sensei Approved', 'Received a clean PASSED verdict five times. The sensei respects your craft.', 'mastery', false),
  ('SQL_SURVIVOR', 'SQL Survivor', 'Completed three kata involving SQL. Joins hold no fear.', 'practice', false),
  ('RUBBER_DUCK', 'Rubber Duck', 'Completed three CHAT kata. You think by writing.', 'practice', false)
ON CONFLICT ("slug") DO NOTHING;
