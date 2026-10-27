"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { FormMessage } from "../../ui";
import { createInvoice, type NewInvoiceState } from "../actions";

type Job = { id: number; customerId: number; label: string };

export function NewInvoiceForm({
  customers,
  jobs,
  initialCustomer,
}: {
  customers: { id: number; label: string }[];
  jobs: Job[];
  initialCustomer?: number;
}) {
  const [state, action, pending] = useActionState<NewInvoiceState, FormData>(createInvoice, { status: "idle" });
  const [customer, setCustomer] = useState(initialCustomer ? String(initialCustomer) : "");
  const theirs = jobs.filter((j) => String(j.customerId) === customer);

  return (
    <form action={action} className="card max-w-2xl space-y-5 p-5 sm:p-6">
      <label className="block">
        <span className="label">Customer</span>
        <select name="customerId" required value={customer} onChange={(e) => setCustomer(e.target.value)} className="field">
          <option value="" disabled>Select…</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <span className="mt-1 block text-xs text-ink-soft">
          Not in the list? <Link href="/admin/customers/new" className="font-medium text-brand-strong hover:underline">Add the customer</Link> first.
        </span>
      </label>

      <fieldset disabled={!customer} className="space-y-2 disabled:opacity-50">
        <legend className="label">What is it for?</legend>
        <label className="flex items-start gap-3 rounded-xl border border-line p-3 has-checked:border-brand has-checked:bg-brand-soft/40">
          <input type="radio" name="bookingId" value="" defaultChecked className="mt-1 accent-[var(--brand)]" />
          <span>
            <span className="block font-medium">A blank invoice</span>
            <span className="block text-sm text-ink-soft">Type the lines yourself: office contracts, extra work, anything not booked online.</span>
          </span>
        </label>
        {theirs.map((j) => (
          <label key={j.id} className="flex items-start gap-3 rounded-xl border border-line p-3 has-checked:border-brand has-checked:bg-brand-soft/40">
            <input type="radio" name="bookingId" value={j.id} className="mt-1 accent-[var(--brand)]" />
            <span>
              <span className="block font-medium">{j.label}</span>
              <span className="block text-sm text-ink-soft">Lines filled in from the booking; any online deposit is credited when issued.</span>
            </span>
          </label>
        ))}
        {customer && theirs.length === 0 && <p className="text-sm text-ink-soft">This customer has no jobs waiting for an invoice.</p>}
      </fieldset>

      <FormMessage state={state} />
      <div className="flex flex-wrap justify-end gap-3">
        <Link href="/admin/invoices" className="btn-secondary min-h-11">Cancel</Link>
        <button type="submit" disabled={pending || !customer} className="btn-primary min-h-11">{pending ? "Creating…" : "Create draft"}</button>
      </div>
    </form>
  );
}
