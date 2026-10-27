"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { FormMessage } from "../ui";
import { saveBooking, type BookingFormState } from "./actions";

type Option = { value: string; label: string };

export type BookingFormValues = {
  id?: number;
  customerName?: string;
  customerId?: number;
  service: string;
  frequency: string;
  date: string;
  time: string;
  address: string;
  town: string;
  price: string;
  deposit: string;
  status: string;
  paymentStatus: string;
  notes: string;
};

const label = (v: string) => v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, " ");

export function BookingForm({
  initial,
  customers,
  services,
  towns,
  frequencies,
  statuses,
  paymentStatuses,
  cancelHref,
}: {
  initial: BookingFormValues;
  customers: Option[];
  services: Option[];
  towns: Option[];
  frequencies: string[];
  statuses: string[];
  paymentStatuses: string[];
  cancelHref: string;
}) {
  const [state, action, pending] = useActionState<BookingFormState, FormData>(saveBooking, { status: "idle" });
  // After an error, React resets the form; show what was typed again.
  const v = { ...initial, ...state.values } as BookingFormValues & Record<string, string>;
  const [mode, setMode] = useState<"existing" | "new">(state.values?.customerMode === "new" || !customers.length ? "new" : "existing");
  const editing = Boolean(initial.id);

  return (
    <form action={action} key={JSON.stringify(state.values ?? {})} className="space-y-6">
      {editing && <input type="hidden" name="id" value={initial.id} />}

      <section className="card space-y-4 p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Customer</h2>
        {editing ? (
          <p>
            <Link href={`/admin/customers/${initial.customerId}`} className="font-medium text-brand-strong hover:underline">{initial.customerName}</Link>
            <span className="text-sm text-ink-soft"> · edit the customer&apos;s details on their page</span>
          </p>
        ) : (
          <>
            <input type="hidden" name="customerMode" value={mode} />
            <div className="inline-flex rounded-xl bg-surface-alt p-1 text-sm font-medium" role="radiogroup" aria-label="Customer">
              {(["existing", "new"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={mode === m}
                  disabled={m === "existing" && !customers.length}
                  onClick={() => setMode(m)}
                  className={`rounded-lg px-4 py-2 ${mode === m ? "bg-white text-ink shadow-sm" : "text-ink-soft disabled:opacity-40"}`}
                >
                  {m === "existing" ? "Existing customer" : "New customer"}
                </button>
              ))}
            </div>
            {mode === "existing" ? (
              <label className="block max-w-md">
                <span className="label">Choose customer</span>
                <select name="customerId" required defaultValue={v.customerId ?? ""} className="field">
                  <option value="" disabled>Select…</option>
                  {customers.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </label>
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                <label>
                  <span className="label">Full name</span>
                  <input name="newName" required minLength={2} defaultValue={v.newName} className="field" autoComplete="off" />
                </label>
                <label>
                  <span className="label">Phone</span>
                  <input name="newPhone" type="tel" required defaultValue={v.newPhone} className="field" autoComplete="off" />
                </label>
                <label>
                  <span className="label">Email <span className="font-normal text-ink-soft">(optional)</span></span>
                  <input name="newEmail" type="email" defaultValue={v.newEmail} className="field" autoComplete="off" />
                </label>
              </div>
            )}
          </>
        )}
      </section>

      <section className="card grid gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
        <h2 className="text-lg font-semibold sm:col-span-2 lg:col-span-4">Job</h2>
        <label className="sm:col-span-2">
          <span className="label">Service</span>
          <select name="service" required defaultValue={v.service} className="field">
            <option value="" disabled>Select…</option>
            {services.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
        <label>
          <span className="label">How often</span>
          <select name="frequency" defaultValue={v.frequency} className="field">
            {frequencies.map((f) => <option key={f} value={f}>{label(f)}</option>)}
          </select>
        </label>
        <label>
          <span className="label">Status</span>
          <select name="status" defaultValue={v.status} className="field">
            {statuses.map((s) => <option key={s} value={s}>{label(s)}</option>)}
          </select>
        </label>
        <label>
          <span className="label">Date</span>
          <input name="date" type="date" required defaultValue={v.date} className="field" />
        </label>
        <label>
          <span className="label">Start time</span>
          <input name="time" type="time" required step={900} defaultValue={v.time} className="field" />
        </label>
        <label className="sm:col-span-2">
          <span className="label">Town</span>
          <select name="town" required defaultValue={v.town} className="field">
            <option value="" disabled>Select…</option>
            {towns.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>
        <label className="sm:col-span-2 lg:col-span-4">
          <span className="label">Address</span>
          <input name="address" required minLength={5} defaultValue={v.address} className="field" />
        </label>
        <label className="sm:col-span-2 lg:col-span-4">
          <span className="label">Notes and access instructions <span className="font-normal text-ink-soft">(shown to cleaners)</span></span>
          <textarea name="notes" rows={2} defaultValue={v.notes} className="field" />
        </label>
      </section>

      <section className="card grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
        <h2 className="text-lg font-semibold sm:col-span-3">Price</h2>
        <label>
          <span className="label">Price (Rs)</span>
          <input name="price" type="number" inputMode="numeric" min={0} step={1} required defaultValue={v.price} className="field" />
        </label>
        <label>
          <span className="label">Deposit (Rs) <span className="font-normal text-ink-soft">(blank = 20%)</span></span>
          <input name="deposit" type="number" inputMode="numeric" min={0} step={1} defaultValue={v.deposit} className="field" />
        </label>
        <label>
          <span className="label">Payment</span>
          <select name="paymentStatus" defaultValue={v.paymentStatus} className="field">
            {paymentStatuses.map((s) => <option key={s} value={s}>{label(s)}</option>)}
          </select>
        </label>
      </section>

      <FormMessage state={state} />
      <div className="flex flex-wrap items-center justify-end gap-3">
        <Link href={cancelHref} className="btn-secondary min-h-11">Cancel</Link>
        <button type="submit" disabled={pending} className="btn-primary min-h-11">{pending ? "Saving…" : editing ? "Save changes" : "Create booking"}</button>
      </div>
    </form>
  );
}
