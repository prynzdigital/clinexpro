"use client";

import { useActionState } from "react";
import { changePassword, type PasswordState } from "./actions";

export function PasswordForm({ minLength, firstTime }: { minLength: number; firstTime?: boolean }) {
  const [state, action, pending] = useActionState<PasswordState, FormData>(changePassword, {});
  const invalid = (f: "current" | "next" | "confirm") => state.fieldErrors?.includes(f) || undefined;

  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="label">{firstTime ? "Temporary password" : "Current password"}</span>
        <input name="current" type="password" required autoComplete="current-password" aria-invalid={invalid("current")} className="field" />
      </label>
      <label className="block">
        <span className="label">New password</span>
        <input name="next" type="password" required minLength={minLength} autoComplete="new-password" aria-invalid={invalid("next")} aria-describedby="pw-hint" className="field" />
        <span id="pw-hint" className="mt-1 block text-xs text-ink-soft">At least {minLength} characters. A short phrase is easier to remember and harder to guess.</span>
      </label>
      <label className="block">
        <span className="label">Repeat new password</span>
        <input name="confirm" type="password" required minLength={minLength} autoComplete="new-password" aria-invalid={invalid("confirm")} className="field" />
      </label>
      {state.error && <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full sm:w-auto">{pending ? "Saving…" : "Save new password"}</button>
    </form>
  );
}
