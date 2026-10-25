ALTER TABLE "leads" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "service" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "preferred_date" date;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "contact_time" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "source" text DEFAULT 'business-page' NOT NULL;