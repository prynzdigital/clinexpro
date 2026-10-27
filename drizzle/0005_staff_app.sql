ALTER TABLE "booking_assignments" ADD COLUMN "checked_in_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "booking_assignments" ADD COLUMN "checked_out_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "booking_assignments" ADD COLUMN "report" text;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "pin_hash" text;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "failed_pin_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "pin_locked_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "session_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "last_login_at" timestamp with time zone;