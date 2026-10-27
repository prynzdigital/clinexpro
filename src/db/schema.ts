import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  date,
  uniqueIndex,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";

export const bookingStatus = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
]);

export const paymentStatus = pgEnum("payment_status", [
  "unpaid",
  "deposit_paid",
  "paid",
  "refunded",
]);

export const frequency = pgEnum("frequency", [
  "once",
  "weekly",
  "fortnightly",
  "monthly",
]);

// One online payment attempt; a booking can have several (a declined card, then a retry).
export const paymentAttemptStatus = pgEnum("payment_attempt_status", [
  "pending",
  "succeeded",
  "failed",
  "cancelled",
]);

export const leadStatus = pgEnum("lead_status", [
  "new",
  "contacted",
  "site_visit",
  "won",
  "lost",
]);

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  address: text("address"),
  town: text("town"),
  lang: text("lang").notNull().default("en"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type BookingDetails = Record<string, number | string | boolean | string[]>;

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  ref: text("ref").notNull().unique(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id),
  service: text("service").notNull(),
  details: jsonb("details").$type<BookingDetails>().notNull(),
  frequency: frequency("frequency").notNull().default("once"),
  date: date("date").notNull(),
  timeSlot: text("time_slot").notNull(),
  // Set by the team when planning; null means the service's usual length (see lib/schedule).
  durationMinutes: integer("duration_minutes"),
  address: text("address").notNull(),
  town: text("town").notNull(),
  notes: text("notes"),
  estimateMur: integer("estimate_mur").notNull(),
  depositMur: integer("deposit_mur").notNull(),
  status: bookingStatus("status").notNull().default("pending"),
  paymentStatus: paymentStatus("payment_status").notNull().default("unpaid"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  company: text("company").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  sector: text("sector").notNull(),
  town: text("town"),
  message: text("message"),
  // Booking-request form fields (home page); null for business-page enquiries.
  address: text("address"),
  service: text("service"),
  preferredDate: date("preferred_date"),
  contactTime: text("contact_time"),
  source: text("source").notNull().default("business-page"),
  status: leadStatus("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const payments = pgTable(
  "payments",
  {
    id: serial("id").primaryKey(),
    bookingId: integer("booking_id")
      .notNull()
      .references(() => bookings.id),
    provider: text("provider").notNull(),
    // The gateway's own transaction id, known once the customer reaches it.
    providerRef: text("provider_ref"),
    kind: text("kind").notNull().default("deposit"),
    amountMur: integer("amount_mur").notNull(),
    status: paymentAttemptStatus("status").notNull().default("pending"),
    raw: jsonb("raw").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("payments_provider_ref_idx").on(t.provider, t.providerRef)],
);

// Cleaners and supervisors who do the jobs. Not dashboard users (that's adminUsers).
export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  // Hex colour that marks this person's jobs on the schedule.
  color: text("color").notNull(),
  active: boolean("active").notNull().default(true),
  // Staff app sign-in: phone + 6-digit PIN set by an admin. Null = no app access.
  pinHash: text("pin_hash"),
  failedPinAttempts: integer("failed_pin_attempts").notNull().default(0),
  pinLockedUntil: timestamp("pin_locked_until", { withTimezone: true }),
  // Bumped on PIN change or deactivation: signs the phone out.
  sessionVersion: integer("session_version").notNull().default(0),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Who is on which job. Team jobs have several rows.
export const bookingAssignments = pgTable(
  "booking_assignments",
  {
    bookingId: integer("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    staffId: integer("staff_id")
      .notNull()
      .references(() => staff.id),
    // Filled in from the staff app.
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    checkedOutAt: timestamp("checked_out_at", { withTimezone: true }),
    report: text("report"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.bookingId, t.staffId] }), index("booking_assignments_staff_idx").on(t.staffId)],
);

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  // "owner" manages the team and settings; "manager" runs bookings, customers and leads.
  role: text("role").notNull().default("owner"),
  active: boolean("active").notNull().default(true),
  // Set when someone else chose the password (new account, reset); cleared once they change it.
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  // Bumped on password change, reset, role change or deactivation: signs out every existing session.
  sessionVersion: integer("session_version").notNull().default(0),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Customer = typeof customers.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
export type Staff = typeof staff.$inferSelect;
