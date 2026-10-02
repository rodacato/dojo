DELETE FROM "user_badges" WHERE "badge_slug" LIKE 'COURSE\_%';--> statement-breakpoint
DELETE FROM "badge_definitions" WHERE "slug" LIKE 'COURSE\_%';--> statement-breakpoint
DROP TABLE "step_nudges";--> statement-breakpoint
DROP TABLE "course_progress";--> statement-breakpoint
DROP TABLE "steps";--> statement-breakpoint
DROP TABLE "lessons";--> statement-breakpoint
DROP TABLE "courses";
