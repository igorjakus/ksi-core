ALTER TABLE "articles" ADD COLUMN "published_at" timestamp;
--> statement-breakpoint
-- Legacy content has no recorded first-publication timestamp. Preserve its creation date.
UPDATE "articles" SET "published_at" = "created_at" WHERE "state" = 'published';
