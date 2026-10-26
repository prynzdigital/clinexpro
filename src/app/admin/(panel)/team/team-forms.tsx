"use client";

import { useActionState, useState } from "react";
import { addMember, resetPassword, updateMember, type TeamState } from "./actions";

const idle: TeamState = { status: "idle" };

export function AddMemberForm() {
  const [state, action, pending] = useActionState(addMember, idle);
  // A fresh key after each success empties the form; errors keep what was typed.
  const [formKey, setFormKey] = useState(0);
  const [lastDone, setLastDone] = useState<TeamState | null>(null);
  if (state.status === "done" && state !== lastDone) {
    setLastDone(state);
    setFormKey((k) => k + 1);
  }

  return (
    <section className="card space-y-4 p-5">
      <h2 className="font-semibold">Add a team member</h2>
      <form key={formKey} action={action} className="space-y-3">
        <label className="block">
          <span className="label">Full name</span>
          <input name="name" required minLength={2} defaultValue={state.values?.name} className="field" autoComplete="off" />
        </label>
        <label className="block">
          <span className="label">Email</span>
          <input name="email" type="email" required defaultValue={state.values?.email} className="field" autoComplete="off" />
        </label>
        <label className="block">
          <span className="label">Role</span>
          <select name="role" defaultValue={state.values?.role ?? "manager"} className="field">
            <option value="manager">Manager</option>
            <option value="owner">Owner</option>
          </select>
        </label>
        <button type="submit" disabled={pending} className="btn-primary w-full">{pending ? "Adding…" : "Add member"}</button>
      </form>
      <Result state={state} />
    </section>
  );
}

export function MemberControls({ id, name, role, active }: { id: number; name: string; role: string; active: boolean }) {
  const [updateState, update, updating] = useActionState(updateMember, idle);
  const [resetState, reset, resetting] = useActionState(resetPassword, idle);

  return (
    <div className="space-y-3 border-t border-line pt-3">
      <form action={update} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="id" value={id} />
        <label className="min-w-36 flex-1">
          <span className="label">Role</span>
          <select name="role" defaultValue={role} className="field" aria-label={`Role for ${name}`}>
            <option value="manager">Manager</option>
            <option value="owner">Owner</option>
          </select>
        </label>
        <label className="min-w-36 flex-1">
          <span className="label">Access</span>
          <select name="active" defaultValue={String(active)} className="field" aria-label={`Access for ${name}`}>
            <option value="true">Can sign in</option>
            <option value="false">No access</option>
          </select>
        </label>
        <button type="submit" disabled={updating} className="btn-secondary min-h-11">{updating ? "Saving…" : "Save"}</button>
      </form>
      <form
        action={reset}
        onSubmit={(e) => {
          if (!confirm(`Give ${name} a new temporary password? They will be signed out.`)) e.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button type="submit" disabled={resetting} className="text-sm font-medium text-brand-strong hover:underline">
          {resetting ? "Resetting…" : "Reset password"}
        </button>
      </form>
      <Result state={updateState} />
      <Result state={resetState} />
    </div>
  );
}

function Result({ state }: { state: TeamState }) {
  const [copied, setCopied] = useState<string | null>(null);
  if (state.status === "idle" || !state.message) return null;
  if (state.status === "error") {
    return <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{state.message}</p>;
  }
  return (
    <div role="status" className="space-y-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
      <p>{state.message}</p>
      {state.password && (
        <>
          <p>Temporary password. It is shown only once; share it privately, for example by phone:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-md bg-white px-3 py-2 font-mono text-base tracking-wider text-ink">{state.password}</code>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(state.password!).then(() => setCopied(state.password!))}
              className="btn-secondary min-h-10 px-3 text-sm"
            >
              {copied === state.password ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="text-xs">They will be asked to choose their own password when they first sign in.</p>
        </>
      )}
    </div>
  );
}
