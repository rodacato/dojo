CREATE TABLE "scrolls" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slug" varchar(64) NOT NULL,
	"manifest" jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"visibility" varchar(20) DEFAULT 'public' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "scrolls_slug_unique" UNIQUE("slug")
);
