CREATE TABLE "houses" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"x" integer NOT NULL,
	"y" integer NOT NULL,
	"placed_at" timestamp DEFAULT now() NOT NULL,
	"last_moved_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "houses_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "laws" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"full_text" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"published_at" timestamp DEFAULT now() NOT NULL,
	"voting_closed_at" timestamp,
	"is_in_tiebreak" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suggestions" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"title" text NOT NULL,
	"text" text NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"reviewed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"discord_id" text NOT NULL,
	"username" text NOT NULL,
	"avatar" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_discord_id_unique" UNIQUE("discord_id")
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"law_id" varchar(36) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"vote" text NOT NULL,
	"voted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "houses" ADD CONSTRAINT "houses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_law_id_laws_id_fk" FOREIGN KEY ("law_id") REFERENCES "public"."laws"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "houses_coordinates_idx" ON "houses" USING btree ("x","y");