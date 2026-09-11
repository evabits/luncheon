CREATE TABLE "shopping_item_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	"level" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shopping_item_flags_item_id_participant_id_unique" UNIQUE("item_id","participant_id")
);
--> statement-breakpoint
CREATE TABLE "shopping_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"jumbo_url" text,
	"price" numeric(10, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_from_request_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shopping_request_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shopping_request_votes_request_id_participant_id_unique" UNIQUE("request_id","participant_id")
);
--> statement-breakpoint
CREATE TABLE "shopping_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"jumbo_url" text,
	"price" numeric(10, 2),
	"requested_by" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"deny_reason" text,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"approved_item_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "config" ADD COLUMN "shopping_requests_per_month" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "shopping_item_flags" ADD CONSTRAINT "shopping_item_flags_item_id_shopping_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."shopping_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_item_flags" ADD CONSTRAINT "shopping_item_flags_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_request_votes" ADD CONSTRAINT "shopping_request_votes_request_id_shopping_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."shopping_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_request_votes" ADD CONSTRAINT "shopping_request_votes_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_requests" ADD CONSTRAINT "shopping_requests_requested_by_participants_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_requests" ADD CONSTRAINT "shopping_requests_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_requests" ADD CONSTRAINT "shopping_requests_approved_item_id_shopping_items_id_fk" FOREIGN KEY ("approved_item_id") REFERENCES "public"."shopping_items"("id") ON DELETE no action ON UPDATE no action;