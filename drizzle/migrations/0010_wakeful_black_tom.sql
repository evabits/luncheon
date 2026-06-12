CREATE TABLE "starting_balance_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" uuid NOT NULL,
	"old_amount" numeric(10, 2) NOT NULL,
	"new_amount" numeric(10, 2) NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN "starting_balance" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "mollie_payment_id" text;--> statement-breakpoint
ALTER TABLE "starting_balance_changes" ADD CONSTRAINT "starting_balance_changes_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_mollie_payment_id_unique" UNIQUE("mollie_payment_id");