CREATE TABLE "jobs" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"gross_salary" integer NOT NULL,
	"fees" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "job_id" varchar(36);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_paid_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;