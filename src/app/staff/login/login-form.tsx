"use client";

import { useActionState } from "react";
import { staffLogin, type StaffLoginState } from "./actions";

export function StaffLoginForm() {
  const [state, action, pending] = useActionState<StaffLoginState, FormData>(staffLogin, { error: "", phone: "" });
  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="label">Mobile number</span>
        <input name="phone" type="tel" inputMode="tel" required autoComplete="tel" defaultValue={state.phone} placeholder="5xxx xxxx" className="field text-lg" />
      </label>
      <label className="block">
        <span className="label">PIN <span id="pin-hint" className="font-normal text-ink-soft">(6 digits)</span></span>
        <input
          name="pin"
          type="password"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          autoComplete="current-password"
          placeholder="••••••"
          aria-describedby="pin-hint"
          className="field text-center font-mono text-2xl tracking-[0.5em]"
        />
      </label>
      {state.error && <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full text-lg">{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
