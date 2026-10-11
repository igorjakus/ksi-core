ALTER TABLE "article_revisions" ADD COLUMN "translations" jsonb DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "translations" jsonb DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "translations" jsonb DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "translations" jsonb DEFAULT '{}' NOT NULL;