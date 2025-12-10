DELETE FROM "houses" WHERE "user_id" IN (SELECT "id" FROM "users" WHERE "discord_id" IS NULL);--> statement-breakpoint
DELETE FROM "users" WHERE "discord_id" IS NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "discord_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "houses" ADD COLUMN "last_color_changed_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "houses" ADD COLUMN "color" text DEFAULT '#FF0000' NOT NULL;