CREATE TABLE "attendance_removals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	"was_fixed_day" boolean DEFAULT false NOT NULL,
	"removed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "participant_fixed_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	CONSTRAINT "participant_fixed_days_participant_id_day_of_week_unique" UNIQUE("participant_id","day_of_week")
);
--> statement-breakpoint
ALTER TABLE "attendance_removals" ADD CONSTRAINT "attendance_removals_session_id_lunch_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."lunch_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_removals" ADD CONSTRAINT "attendance_removals_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participant_fixed_days" ADD CONSTRAINT "participant_fixed_days_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;