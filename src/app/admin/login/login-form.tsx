"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const input =
  "block w-full rounded-xl border border-white/70 bg-white/75 px-4 py-3 text-base text-ink shadow-sm placeholder:text-ink-soft/60 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/25";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, { error: "", email: "" });
  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="label">Email</span>
        <input name="email" type="email" required autoComplete="username" defaultValue={state.email} className={input} />
      </label>
      <label className="block">
        <span className="label">Password</span>
        <input name="password" type="password" required autoComplete="current-password" className={input} />
      </label>
      {state.error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger" role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-glow w-full">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
