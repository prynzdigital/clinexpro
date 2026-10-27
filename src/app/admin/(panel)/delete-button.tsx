"use client";

import { Icon } from "@/components/icons";

/** Delete with a confirmation; when blocked, explains why instead of deleting. */
export function DeleteButton({
  action,
  id,
  noun,
  blockedReason,
  extra,
}: {
  action: (formData: FormData) => Promise<void>;
  id: number;
  noun: string;
  blockedReason?: string | null;
  extra?: Record<string, string>;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (blockedReason) {
          e.preventDefault();
          alert(`This ${noun} can't be deleted. ${blockedReason}`);
        } else if (!confirm(`Delete this ${noun}? This can't be undone.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      {extra && Object.entries(extra).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <button
        type="submit"
        title={blockedReason ?? undefined}
        className={`btn min-h-10 gap-1.5 border px-4 text-sm ${blockedReason ? "border-line text-ink-soft/60" : "border-rose-200 bg-white text-danger hover:bg-rose-50"}`}
      >
        <Icon name="trash" width={16} height={16} /> Delete
      </button>
    </form>
  );
}
