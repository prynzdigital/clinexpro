"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormMessage } from "../ui";
import { saveLead, type LeadFormState } from "./actions";

export type LeadValues = {
  id?: number;
  company: string;
  contactName: string;
  phone: string;
  email: string;
  sector: string;
  town: string;
  address: string;
  service: string;
  preferredDate: string;
  status: string;
  message: string;
};

type Option = { value: string; label: string };

export function LeadForm({
  initial,
  sectors,
  services,
  statuses,
}: {
  initial: LeadValues;
  sectors: Option[];
  services: Option[];
  statuses: Option[];
}) {
  const [state, action, pending] = useActionState<LeadFormState, FormData>(saveLead, { status: "idle" });
  const v = { ...initial, ...state.values } as LeadValues;
  return (
    <form action={action} key={JSON.stringify(state.values ?? {})} className="card space-y-5 p-5 sm:p-6">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="label">Company or client</span>
          <input name="company" required minLength={2} defaultValue={v.company} className="field" />
        </label>
        <label>
          <span className="label">Contact person</span>
          <input name="contactName" required minLength={2} defaultValue={v.contactName} className="field" />
        </label>
        <label>
          <span className="label">Phone</span>
          <input name="phone" type="tel" required minLength={7} defaultValue={v.phone} className="field" />
        </label>
        <label>
          <span className="label">Email</span>
          <input name="email" type="email" required defaultValue={v.email} className="field" />
        </label>
        <label>
          <span className="label">Type of premises</span>
          <select name="sector" defaultValue={v.sector} className="field">
            {sectors.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
        <label>
          <span className="label">Status</span>
          <select name="status" defaultValue={v.status} className="field">
            {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
        <label>
          <span className="label">Service wanted</span>
          <select name="service" defaultValue={v.service} className="field">
            <option value="">Not specified</option>
            {services.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
        <label>
          <span className="label">Preferred start</span>
          <input name="preferredDate" type="date" defaultValue={v.preferredDate} className="field" />
        </label>
        <label>
          <span className="label">Town</span>
          <input name="town" defaultValue={v.town} className="field" />
        </label>
        <label>
          <span className="label">Address</span>
          <input name="address" defaultValue={v.address} className="field" />
        </label>
        <label className="sm:col-span-2">
          <span className="label">What they need / notes</span>
          <textarea name="message" rows={4} defaultValue={v.message} className="field" />
        </label>
      </div>
      <FormMessage state={state} />
      <div className="flex flex-wrap justify-end gap-3">
        <Link href="/admin/leads" className="btn-secondary min-h-11">Cancel</Link>
        <button type="submit" disabled={pending} className="btn-primary min-h-11">{pending ? "Saving…" : initial.id ? "Save changes" : "Add lead"}</button>
      </div>
    </form>
  );
}
