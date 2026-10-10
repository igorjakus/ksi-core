CREATE TYPE "member_role" AS ENUM('member', 'board', 'administrator');--> statement-breakpoint
CREATE TYPE "membership_status" AS ENUM('pending', 'active', 'suspended', 'deleted');--> statement-breakpoint
CREATE TYPE "public_privacy" AS ENUM('full-name', 'last-initial', 'initials');--> statement-breakpoint
CREATE TABLE "article_contributors" (
	"id" text PRIMARY KEY,
	"article_id" text NOT NULL,
	"user_id" text NOT NULL,
	"public_credit" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "article_proposals" (
	"id" text PRIMARY KEY,
	"article_id" text NOT NULL,
	"author_id" text NOT NULL,
	"base_version" integer NOT NULL,
	"title" text NOT NULL,
	"markdown" text NOT NULL,
	"state" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "article_revisions" (
	"id" text PRIMARY KEY,
	"article_id" text NOT NULL,
	"version" integer NOT NULL,
	"title" text NOT NULL,
	"markdown" text NOT NULL,
	"actor_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" text PRIMARY KEY,
	"project_id" text,
	"slug" text NOT NULL UNIQUE,
	"title" text NOT NULL,
	"markdown" text DEFAULT '' NOT NULL,
	"language" text DEFAULT 'pl' NOT NULL,
	"state" text DEFAULT 'draft' NOT NULL,
	"main_article" boolean DEFAULT false NOT NULL,
	"project_feed" boolean DEFAULT false NOT NULL,
	"website_feed" boolean DEFAULT false NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" text PRIMARY KEY,
	"actor_id" text,
	"project_id" text,
	"action" text NOT NULL,
	"target_id" text NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_handoffs" (
	"id" text PRIMARY KEY,
	"session_id" text NOT NULL,
	"environment" text NOT NULL,
	"destination" text NOT NULL,
	"state" text NOT NULL,
	"challenge" text NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boards" (
	"id" text PRIMARY KEY,
	"project_id" text,
	"scope_key" text NOT NULL UNIQUE,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" text PRIMARY KEY,
	"thread_id" text,
	"item_id" text,
	"author_id" text NOT NULL,
	"markdown" text NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file_references" (
	"id" text PRIMARY KEY,
	"file_id" text NOT NULL,
	"owner_type" text NOT NULL,
	"owner_id" text NOT NULL,
	"public" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" text PRIMARY KEY,
	"hash" text NOT NULL,
	"object_key" text NOT NULL UNIQUE,
	"filename" text NOT NULL,
	"mime" text NOT NULL,
	"size" integer NOT NULL,
	"environment" text NOT NULL,
	"uploader_id" text NOT NULL,
	"state" text DEFAULT 'private' NOT NULL,
	"orphaned_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "frontend_sessions" (
	"id" text PRIMARY KEY,
	"session_id" text NOT NULL,
	"origin" text NOT NULL,
	"environment" text NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "join_requests" (
	"id" text PRIMARY KEY,
	"project_id" text NOT NULL,
	"user_id" text NOT NULL,
	"state" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kanban_items" (
	"id" text PRIMARY KEY,
	"board_id" text NOT NULL,
	"title" text NOT NULL,
	"markdown" text DEFAULT '' NOT NULL,
	"column" text DEFAULT 'todo' NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp,
	"author_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mail_jobs" (
	"id" text PRIMARY KEY,
	"to" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"available_at" timestamp DEFAULT now() NOT NULL,
	"sent_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "outbox" (
	"id" text PRIMARY KEY,
	"event_id" text NOT NULL,
	"delivered_at" timestamp,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_links" (
	"id" text PRIMARY KEY,
	"project_id" text NOT NULL,
	"label" text NOT NULL,
	"url" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_members" (
	"id" text PRIMARY KEY,
	"project_id" text NOT NULL,
	"user_id" text NOT NULL,
	"leader" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY,
	"slug" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"fields" text[] DEFAULT '{}'::text[] NOT NULL,
	"locked" boolean DEFAULT false NOT NULL,
	"layout" jsonb DEFAULT '[]' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "threads" (
	"id" text PRIMARY KEY,
	"project_id" text,
	"title" text NOT NULL,
	"visibility" text DEFAULT 'association' NOT NULL,
	"invited_ids" text[] DEFAULT '{}'::text[] NOT NULL,
	"author_id" text NOT NULL,
	"archived_at" timestamp,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "nickname" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "github" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "linkedin" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "public_privacy" "public_privacy" DEFAULT 'last-initial'::"public_privacy" NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "membership_status" "membership_status" DEFAULT 'pending'::"membership_status" NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "member_role" DEFAULT 'member'::"member_role" NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "flags" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "alerts" ALTER COLUMN "created_by" DROP NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "article_contributor_unique" ON "article_contributors" ("article_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "article_revision_unique" ON "article_revisions" ("article_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "file_reference_unique" ON "file_references" ("file_id","owner_type","owner_id");--> statement-breakpoint
CREATE INDEX "file_hash" ON "files" ("environment","hash");--> statement-breakpoint
CREATE UNIQUE INDEX "join_request_unique" ON "join_requests" ("project_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_member_unique" ON "project_members" ("project_id","user_id");--> statement-breakpoint
ALTER TABLE "article_contributors" ADD CONSTRAINT "article_contributors_article_id_articles_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id");--> statement-breakpoint
ALTER TABLE "article_contributors" ADD CONSTRAINT "article_contributors_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "article_proposals" ADD CONSTRAINT "article_proposals_article_id_articles_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id");--> statement-breakpoint
ALTER TABLE "article_proposals" ADD CONSTRAINT "article_proposals_author_id_users_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "article_revisions" ADD CONSTRAINT "article_revisions_article_id_articles_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id");--> statement-breakpoint
ALTER TABLE "article_revisions" ADD CONSTRAINT "article_revisions_actor_id_users_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_id_users_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");--> statement-breakpoint
ALTER TABLE "auth_handoffs" ADD CONSTRAINT "auth_handoffs_session_id_sessions_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "boards" ADD CONSTRAINT "boards_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_thread_id_threads_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "threads"("id");--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_item_id_kanban_items_id_fkey" FOREIGN KEY ("item_id") REFERENCES "kanban_items"("id");--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_users_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "file_references" ADD CONSTRAINT "file_references_file_id_files_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id");--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_uploader_id_users_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "frontend_sessions" ADD CONSTRAINT "frontend_sessions_session_id_sessions_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "join_requests" ADD CONSTRAINT "join_requests_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");--> statement-breakpoint
ALTER TABLE "join_requests" ADD CONSTRAINT "join_requests_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "kanban_items" ADD CONSTRAINT "kanban_items_board_id_boards_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards"("id");--> statement-breakpoint
ALTER TABLE "kanban_items" ADD CONSTRAINT "kanban_items_author_id_users_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "outbox" ADD CONSTRAINT "outbox_event_id_audit_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "audit_events"("id");--> statement-breakpoint
ALTER TABLE "project_links" ADD CONSTRAINT "project_links_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_author_id_users_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id");