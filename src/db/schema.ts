import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  date,
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

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("owner"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Customer = typeof customers.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Lead = typeof leads.$inferSelect;
