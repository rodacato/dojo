CREATE TABLE "scroll_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scroll_id" uuid NOT NULL,
	"user_id" uuid,
	"anonymous_id" text,
	"unit_id" varchar(128) NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"state" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scroll_progress_owner_chk" CHECK (("scroll_progress"."user_id" IS NOT NULL AND "scroll_progress"."anonymous_id" IS NULL) OR ("scroll_progress"."user_id" IS NULL AND "scroll_progress"."anonymous_id" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "scroll_progress" ADD CONSTRAINT "scroll_progress_scroll_id_scrolls_id_fk" FOREIGN KEY ("scroll_id") REFERENCES "public"."scrolls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scroll_progress" ADD CONSTRAINT "scroll_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "scroll_progress_user_unit_uniq" ON "scroll_progress" USING btree ("user_id","scroll_id","unit_id") WHERE "scroll_progress"."user_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "scroll_progress_anon_unit_uniq" ON "scroll_progress" USING btree ("anonymous_id","scroll_id","unit_id") WHERE "scroll_progress"."anonymous_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "scroll_progress_anon_idx" ON "scroll_progress" USING btree ("anonymous_id") WHERE "scroll_progress"."anonymous_id" IS NOT NULL;