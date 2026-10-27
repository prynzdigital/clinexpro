"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { staffLogin, type StaffLoginState } from "./actions";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"] as const;

/** Mobile number, then a 6-digit PIN on a big keypad (also works with a keyboard). */
export function StaffLoginForm() {
  const [state, action, pending] = useActionState<StaffLoginState, FormData>(staffLogin, { error: "", phone: "" });
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(0);
  const form = useRef<HTMLFormElement>(null);
  const phone = useRef<HTMLInputElement>(null);

  // A wrong PIN: clear the dots and give a little shake.
  const [lastError, setLastError] = useState("");
  if (state.error !== lastError) {
    setLastError(state.error);
    if (state.error) {
      setPin("");
      setShake((n) => n + 1);
    }
  }

  const press = (key: (typeof KEYS)[number]) => {
    if (pending) return;
    if (key === "back") setPin((p) => p.slice(0, -1));
    else if (key === "clear") setPin("");
    else
      setPin((p) => {
        const next = (p + key).slice(0, 6);
        // Six digits and a phone number: sign in straight away.
        if (next.length === 6 && phone.current?.value.trim()) setTimeout(() => form.current?.requestSubmit(), 120);
        return next;
      });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.activeElement === phone.current) return;
      if (/^\d$/.test(e.key)) press(e.key as (typeof KEYS)[number]);
      else if (e.key === "Backspace") press("back");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <form ref={form} action={action} className="flex flex-1 flex-col">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-white/80">Mobile number</span>
        <span className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 ring-1 ring-white/15 focus-within:ring-2 focus-within:ring-accent">
          <Icon name="phone" width={18} height={18} className="text-white/60" />
          <input
            ref={phone}
            name="phone"
            type="tel"
            inputMode="tel"
            required
            autoComplete="tel"
            defaultValue={state.phone}
            placeholder="5xxx xxxx"
            className="min-h-14 w-full bg-transparent text-lg text-white placeholder:text-white/40 focus:outline-none"
          />
        </span>
      </label>

      <input type="hidden" name="pin" value={pin} />
      <p className="mt-6 text-center text-sm font-medium text-white/80">Your 6-digit PIN</p>
      <div key={shake} className={`mt-3 flex justify-center gap-3 ${shake ? "animate-shake" : ""}`} aria-live="polite" aria-label={`${pin.length} of 6 digits entered`}>
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className={`size-4 rounded-full transition-all ${i < pin.length ? "scale-110 bg-accent" : "bg-white/20"}`} />
        ))}
      </div>

      {state.error && (
        <p role="alert" className="mt-4 rounded-2xl bg-rose-500/20 px-4 py-3 text-center text-sm font-medium text-rose-100">{state.error}</p>
      )}

      <div className="mx-auto mt-6 grid w-full max-w-xs grid-cols-3 gap-3">
        {KEYS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => press(k)}
            aria-label={k === "back" ? "Delete last digit" : k === "clear" ? "Clear PIN" : k}
            className={`grid h-16 place-items-center rounded-2xl text-2xl font-semibold transition active:scale-95 ${k === "back" || k === "clear" ? "text-base text-white/70" : "bg-white/10 text-white hover:bg-white/15"}`}
          >
            {k === "back" ? <Icon name="arrow" width={22} height={22} className="rotate-180" /> : k === "clear" ? "Clear" : k}
          </button>
        ))}
      </div>

      <button
        type="submit"
        disabled={pending || pin.length !== 6}
        className="mt-6 min-h-14 w-full rounded-full bg-brand text-lg font-bold text-white shadow-[0_10px_30px_-10px_rgba(252,81,29,0.9)] disabled:opacity-40"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
