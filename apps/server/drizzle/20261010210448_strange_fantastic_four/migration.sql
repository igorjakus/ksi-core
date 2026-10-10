CREATE TABLE "avatar_requests" (
	"user_id" text PRIMARY KEY,
	"file_id" text,
	"state" text DEFAULT 'pending' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp,
	"reviewed_by" text
);
--> statement-breakpoint
ALTER TABLE "avatar_requests" ADD CONSTRAINT "avatar_requests_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "avatar_requests" ADD CONSTRAINT "avatar_requests_file_id_files_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id");--> statement-breakpoint
ALTER TABLE "avatar_requests" ADD CONSTRAINT "avatar_requests_reviewed_by_users_id_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id");