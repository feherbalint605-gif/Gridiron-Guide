CREATE TABLE "athlete_plan_overrides" (
	"id" serial PRIMARY KEY NOT NULL,
	"coach_id" text NOT NULL,
	"athlete_id" text NOT NULL,
	"position_id" text NOT NULL,
	"details" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "athlete_plan_overrides_coach_id_athlete_id_position_id_unique" UNIQUE("coach_id","athlete_id","position_id")
);
--> statement-breakpoint
CREATE TABLE "coach_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"coach_id" text NOT NULL,
	"athlete_id" text NOT NULL,
	"position_id" text NOT NULL,
	"workout_title" text NOT NULL,
	"exercise_name" text NOT NULL,
	"comment" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "coach_comments_coach_id_athlete_id_position_id_workout_title_exercise_name_unique" UNIQUE("coach_id","athlete_id","position_id","workout_title","exercise_name")
);
--> statement-breakpoint
CREATE TABLE "playbook_folder_teams" (
	"coach_id" text NOT NULL,
	"folder" text NOT NULL,
	"team_id" integer NOT NULL,
	CONSTRAINT "playbook_folder_teams_coach_id_folder_pk" PRIMARY KEY("coach_id","folder")
);
--> statement-breakpoint
CREATE TABLE "playbook_plays" (
	"id" serial PRIMARY KEY NOT NULL,
	"coach_id" text NOT NULL,
	"name" text NOT NULL,
	"folder" text DEFAULT 'Általános' NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "positions" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"details" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"team_id" integer NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "team_members_team_id_user_id_unique" UNIQUE("team_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "team_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"author_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"coach_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workout_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"position_id" text NOT NULL,
	"week" integer NOT NULL,
	"workout_title" text NOT NULL,
	"exercise_name" text NOT NULL,
	"set_index" integer NOT NULL,
	"weight" integer NOT NULL,
	"reps" integer
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"role" varchar DEFAULT 'athlete',
	"coach_id" varchar,
	"selected_position_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");