CREATE TABLE "fixed_day_opt_outs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" uuid NOT NULL,
	"date" text NOT NULL,
	CONSTRAINT "fixed_day_opt_outs_participant_id_date_unique" UNIQUE("participant_id","date")
);
--> statement-breakpoint
ALTER TABLE "fixed_day_opt_outs" ADD CONSTRAINT "fixed_day_opt_outs_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;