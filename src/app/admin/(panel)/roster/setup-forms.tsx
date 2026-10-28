"use client";

import { useActionState, useState } from "react";
import { FormMessage } from "../ui";
import { saveCrew, saveSite, type SetupState } from "./setup-actions";

type Option = { value: string; label: string };

export type SiteValues = { id?: number; name: string; customerId: string; address: string; town: string; instructions: string; active: boolean };

export function SiteForm({ initial, customers, towns, onDone }: { initial: SiteValues; customers: Option[]; towns: Option[]; onDone?: () => void }) {
  const [state, action, pending] = useActionState<SetupState, FormData>(async (prev, fd) => {
    const result = await saveSite(prev, fd);
    if (result.status === "saved") onDone?.();
    return result;
  }, { status: "idle" });
  return (
    <form action={action} className="space-y-3">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="label">Site name</span>
          <input name="name" required minLength={2} defaultValue={initial.name} placeholder="e.g. Hotel Le Lagon – Grand Baie" className="field" />
        </label>
        <label>
          <span className="label">Client (for invoices)</span>
          <select name="customerId" defaultValue={initial.customerId} className="field">
            <option value="">Not linked</option>
            {customers.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </label>
        <label>
          <span className="label">Town</span>
          <select name="town" defaultValue={initial.town} className="field">
            <option value="">Not set</option>
            {towns.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>
        <label className="sm:col-span-2">
          <span className="label">Address</span>
          <input name="address" defaultValue={initial.address} className="field" />
        </label>
        <label className="sm:col-span-2">
          <span className="label">Instructions for the crew <span className="font-normal text-ink-soft">(where to report, uniform, access cards…)</span></span>
          <textarea name="instructions" rows={2} defaultValue={initial.instructions} className="field" />
        </label>
        {initial.id && (
          <label>
            <span className="label">Status</span>
            <select name="active" defaultValue={String(initial.active)} className="field">
              <option value="true">Active</option>
              <option value="false">Inactive (contract ended)</option>
            </select>
          </label>
        )}
      </div>
      <FormMessage state={state} />
      <button type="submit" disabled={pending} className="btn-primary min-h-11">{pending ? "Saving…" : initial.id ? "Save site" : "Add site"}</button>
    </form>
  );
}

export function CrewForm({
  initial,
  staff,
}: {
  initial: { id?: number; name: string; leaderId: string; members: number[] };
  staff: { id: number; name: string; color: string }[];
}) {
  const [state, action, pending] = useActionState<SetupState, FormData>(saveCrew, { status: "idle" });
  const [members, setMembers] = useState<number[]>(initial.members);
  const [leader, setLeader] = useState(initial.leaderId);
  return (
    <form action={action} className="space-y-3">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <label className="block">
        <span className="label">Crew name</span>
        <input name="name" required minLength={2} defaultValue={initial.name} placeholder="e.g. Hotel crew A" className="field" />
      </label>
      <fieldset>
        <legend className="label">People <span className="font-normal text-ink-soft">(★ = leader)</span></legend>
        <div className="flex flex-wrap gap-2">
          {staff.map((p) => {
            const on = members.includes(p.id);
            const isLeader = leader === String(p.id);
            return (
              <span key={p.id} className={`flex items-center overflow-hidden rounded-full border text-sm ${on ? "border-transparent text-white" : "border-line bg-white"}`} style={on ? { background: p.color } : undefined}>
                <label className="flex cursor-pointer items-center gap-1.5 py-1.5 pl-3 pr-2">
                  <input
                    type="checkbox"
                    name="members"
                    value={p.id}
                    checked={on}
                    onChange={() => {
                      setMembers((m) => (on ? m.filter((x) => x !== p.id) : [...m, p.id]));
                      if (on && isLeader) setLeader("");
                    }}
                    className="sr-only"
                  />
                  {p.name}
                </label>
                {on && (
                  <button type="button" onClick={() => setLeader(isLeader ? "" : String(p.id))} className={`px-2 py-1.5 ${isLeader ? "text-yellow-300" : "text-white/60 hover:text-white"}`} aria-label={`${isLeader ? "Remove" : "Make"} ${p.name} leader`} aria-pressed={isLeader}>
                    ★
                  </button>
                )}
              </span>
            );
          })}
        </div>
      </fieldset>
      <input type="hidden" name="leaderId" value={leader} />
      <FormMessage state={state} />
      <button type="submit" disabled={pending} className="btn-primary min-h-11">{pending ? "Saving…" : initial.id ? "Save crew" : "Create crew"}</button>
    </form>
  );
}
