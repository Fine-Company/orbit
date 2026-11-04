ALTER TABLE "projects" ADD COLUMN "github_id" bigint;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "github_url" text;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_github_id_unique" UNIQUE("github_id");