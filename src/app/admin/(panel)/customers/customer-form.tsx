"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormMessage } from "../ui";
import { saveCustomer, type CustomerFormState } from "./actions";

export type CustomerValues = { id?: number; name: string; phone: string; email: string; address: string; town: string; lang: string; notes: string };

export function CustomerForm({ initial, towns, cancelHref }: { initial: CustomerValues; towns: { value: string; label: string }[]; cancelHref: string }) {
  const [state, action, pending] = useActionState<CustomerFormState, FormData>(saveCustomer, { status: "idle" });
  // After an error React resets the form; put back what was typed.
  const v = { ...initial, ...state.values } as CustomerValues;
  return (
    <form action={action} key={JSON.stringify(state.values ?? {})} className="card max-w-3xl space-y-5 p-5 sm:p-6">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="label">Full name</span>
          <input name="name" required minLength={2} defaultValue={v.name} className="field" autoComplete="off" />
        </label>
        <label>
          <span className="label">Phone</span>
          <input name="phone" type="tel" required minLength={7} defaultValue={v.phone} className="field" autoComplete="off" />
        </label>
        <label>
          <span className="label">Email <span className="font-normal text-ink-soft">(optional)</span></span>
          <input name="email" type="email" defaultValue={v.email} className="field" autoComplete="off" />
        </label>
        <label className="sm:col-span-2">
          <span className="label">Address</span>
          <input name="address" defaultValue={v.address} className="field" />
        </label>
        <label>
          <span className="label">Town</span>
          <select name="town" defaultValue={v.town} className="field">
            <option value="">Not set</option>
            {towns.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>
        <label>
          <span className="label">Language for messages</span>
          <select name="lang" defaultValue={v.lang} className="field">
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
        </label>
        <label className="sm:col-span-2">
          <span className="label">Notes (preferences, access, pets…)</span>
          <textarea name="notes" rows={3} defaultValue={v.notes} className="field" />
        </label>
      </div>
      <FormMessage state={state} />
      <div className="flex flex-wrap justify-end gap-3">
        <Link href={cancelHref} className="btn-secondary min-h-11">Cancel</Link>
        <button type="submit" disabled={pending} className="btn-primary min-h-11">{pending ? "Saving…" : initial.id ? "Save changes" : "Add customer"}</button>
      </div>
    </form>
  );
}
