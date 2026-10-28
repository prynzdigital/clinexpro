import { sql } from "drizzle-orm";
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

export const invoiceStatus = pgEnum("invoice_status", ["draft", "issued", "void"]);

export const paymentMethod = pgEnum("payment_method", [
  "cash",
  "bank_transfer",
  "juice",
  "card_online",
  "cheque",
  "other",
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
  // Optional for customers the office adds by phone; website bookings always have one.
  email: text("email").unique(),
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
    // The crew leader for this job (one per job; others follow their lead).
    isLeader: boolean("is_leader").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.bookingId, t.staffId] }), index("booking_assignments_staff_idx").on(t.staffId)],
);

// --- Contract work: sites, shifts and the roster -----------------------------
// Hotels and offices are staffed by shifts at a site. Crews are not fixed:
// each shift has its own people and leader; saved crews only speed up filling.

export const sites = pgTable("sites", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  customerId: integer("customer_id").references(() => customers.id),
  address: text("address"),
  town: text("town"),
  // Where to report, uniform, access cards... shown to the crew.
  instructions: text("instructions"),
  color: text("color").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const shifts = pgTable(
  "shifts",
  {
    id: serial("id").primaryKey(),
    siteId: integer("site_id")
      .notNull()
      .references(() => sites.id),
    date: date("date").notNull(),
    // "HH:MM" in Mauritius time; an end before the start runs past midnight.
    start: text("start").notNull(),
    end: text("end").notNull(),
    label: text("label"),
    headcount: integer("headcount").notNull().default(1),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("shifts_date_idx").on(t.date)],
);

export const shiftAssignments = pgTable(
  "shift_assignments",
  {
    shiftId: integer("shift_id")
      .notNull()
      .references(() => shifts.id, { onDelete: "cascade" }),
    staffId: integer("staff_id")
      .notNull()
      .references(() => staff.id),
    isLeader: boolean("is_leader").notNull().default(false),
    // Clock in/out from the staff app (the office can correct them); timesheets use these.
    clockInAt: timestamp("clock_in_at", { withTimezone: true }),
    clockOutAt: timestamp("clock_out_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.shiftId, t.staffId] }), index("shift_assignments_staff_idx").on(t.staffId)],
);

// Saved crews: named groups the manager can drop onto a shift or job, then adjust.
export const crews = pgTable("crews", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  leaderId: integer("leader_id").references(() => staff.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const crewMembers = pgTable(
  "crew_members",
  {
    crewId: integer("crew_id")
      .notNull()
      .references(() => crews.id, { onDelete: "cascade" }),
    staffId: integer("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.crewId, t.staffId] })],
);

// Invoices. Amounts are in cents (MUR × 100) so VAT is exact. A draft has no
// number and can be edited or deleted; issuing assigns the next number and
// locks it; mistakes are voided (kept, with a reason), never deleted.
export const invoices = pgTable(
  "invoices",
  {
    id: serial("id").primaryKey(),
    number: text("number").unique(),
    // Unguessable id for the customer's link (/i/<token>).
    token: text("token").notNull().unique(),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id),
    bookingId: integer("booking_id").references(() => bookings.id),
    status: invoiceStatus("status").notNull().default("draft"),
    // Bill-to details are copied in, so later customer edits don't change issued invoices.
    billName: text("bill_name").notNull(),
    billEmail: text("bill_email"),
    billAddress: text("bill_address"),
    lang: text("lang").notNull().default("en"),
    issueDate: date("issue_date"),
    dueDate: date("due_date"),
    // VAT rate in basis points (1500 = 15%); line prices include VAT.
    vatRateBp: integer("vat_rate_bp").notNull().default(0),
    totalCents: integer("total_cents").notNull().default(0),
    vatCents: integer("vat_cents").notNull().default(0),
    notes: text("notes"),
    voidReason: text("void_reason"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  // One live invoice per booking; a voided one doesn't block re-invoicing.
  (t) => [uniqueIndex("invoices_booking_idx").on(t.bookingId).where(sql`${t.status} <> 'void'`)],
);

export const invoiceLines = pgTable("invoice_lines", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  position: integer("position").notNull().default(0),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitCents: integer("unit_cents").notNull(),
});

// Money received against an invoice: entered by the office, or copied from a
// successful online payment (paymentId set, so it is only counted once).
export const invoicePayments = pgTable("invoice_payments", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoices.id),
  amountCents: integer("amount_cents").notNull(),
  method: paymentMethod("method").notNull(),
  receivedOn: date("received_on").notNull(),
  reference: text("reference"),
  paymentId: integer("payment_id")
    .unique()
    .references(() => payments.id),
  recordedBy: integer("recorded_by").references(() => adminUsers.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Next invoice number per year; updated inside the issuing transaction so numbers never skip or repeat.
export const invoiceCounters = pgTable("invoice_counters", {
  year: integer("year").primaryKey(),
  last: integer("last").notNull(),
});

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
export type Site = typeof sites.$inferSelect;
export type Shift = typeof shifts.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type InvoiceLine = typeof invoiceLines.$inferSelect;
export type InvoicePayment = typeof invoicePayments.$inferSelect;
