"use client";

import { useActionState } from "react";
import { removeAppAccess, setPin, type PinState } from "./actions";

export function AppAccess({ id, name, hasPin, active, lastLogin }: { id: number; name: string; hasPin: boolean; active: boolean; lastLogin: string | null }) {
  const [state, action, pending] = useActionState<PinState, FormData>(setPin, { status: "idle" });

  return (
    <div className="w-full space-y-2 border-t border-line pt-3 text-sm">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span>
          <span className="font-medium">Staff app:</span>{" "}
          {hasPin ? <span className="text-emerald-700">On{lastLogin ? ` · last used ${lastLogin}` : " · not used yet"}</span> : <span className="text-ink-soft">Off</span>}
        </span>
        {active && (
          <form action={action}>
            <input type="hidden" name="id" value={id} />
            <button type="submit" disabled={pending} className="font-medium text-brand-strong hover:underline">
              {pending ? "Creating…" : hasPin ? "New PIN" : "Give app access"}
            </button>
          </form>
        )}
        {hasPin && (
          <form
            action={removeAppAccess}
            onSubmit={(e) => {
              if (!confirm(`Turn off the staff app for ${name}? Their phone will be signed out.`)) e.preventDefault();
            }}
          >
            <input type="hidden" name="id" value={id} />
            <button type="submit" className="font-medium text-ink-soft hover:text-danger hover:underline">Turn off</button>
          </form>
        )}
      </div>
      {state.status === "error" && <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 font-medium text-danger">{state.message}</p>}
      {state.status === "done" && state.pin && (
        <div role="status" className="rounded-lg bg-emerald-50 p-3 text-emerald-900">
          <p>{state.message}</p>
          <p className="my-1 font-mono text-2xl font-bold tracking-[0.3em] text-ink">{state.pin}</p>
          <p className="text-xs">Shown only once. Tell them in person or by phone; any older PIN no longer works.</p>
        </div>
      )}
    </div>
  );
}
