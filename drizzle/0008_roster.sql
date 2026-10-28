CREATE TABLE "crew_members" (
	"crew_id" integer NOT NULL,
	"staff_id" integer NOT NULL,
	CONSTRAINT "crew_members_crew_id_staff_id_pk" PRIMARY KEY("crew_id","staff_id")
);
--> statement-breakpoint
CREATE TABLE "crews" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"leader_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_assignments" (
	"shift_id" integer NOT NULL,
	"staff_id" integer NOT NULL,
	"is_leader" boolean DEFAULT false NOT NULL,
	"clock_in_at" timestamp with time zone,
	"clock_out_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shift_assignments_shift_id_staff_id_pk" PRIMARY KEY("shift_id","staff_id")
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer NOT NULL,
	"date" date NOT NULL,
	"start" text NOT NULL,
	"end" text NOT NULL,
	"label" text,
	"headcount" integer DEFAULT 1 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"customer_id" integer,
	"address" text,
	"town" text,
	"instructions" text,
	"color" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "booking_assignments" ADD COLUMN "is_leader" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "crew_members" ADD CONSTRAINT "crew_members_crew_id_crews_id_fk" FOREIGN KEY ("crew_id") REFERENCES "public"."crews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crew_members" ADD CONSTRAINT "crew_members_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crews" ADD CONSTRAINT "crews_leader_id_staff_id_fk" FOREIGN KEY ("leader_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "shift_assignments_staff_idx" ON "shift_assignments" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "shifts_date_idx" ON "shifts" USING btree ("date");