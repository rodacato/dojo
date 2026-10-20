CREATE TABLE "practitioner_looks" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"look" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_pieces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"piece_id" varchar(64) NOT NULL,
	"session_id" uuid,
	"earned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "practitioner_looks" ADD CONSTRAINT "practitioner_looks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_pieces" ADD CONSTRAINT "user_pieces_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_pieces" ADD CONSTRAINT "user_pieces_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_pieces_user_piece_uniq" ON "user_pieces" USING btree ("user_id","piece_id");--> statement-breakpoint
CREATE INDEX "user_pieces_session_idx" ON "user_pieces" USING btree ("session_id");