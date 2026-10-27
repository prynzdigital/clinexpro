"use client";

import { useActionState, useMemo, useState } from "react";
import { deleteDraft, issueInvoice, recordPayment, saveDraft, sendInvoice, voidInvoice, type FormState } from "../actions";

const idle: FormState = { status: "idle" };

type EditLine = { key: number; description: string; quantity: string; unit: string };

const toRupees = (cents: number) => (cents % 100 ? (cents / 100).toFixed(2) : String(cents / 100));
const fmt = (cents: number) =>
  new Intl.NumberFormat("en-MU", { style: "currency", currency: "MUR", minimumFractionDigits: 2 }).format(cents / 100);

export function DraftEditor({
  invoice,
  lines: initial,
  vatRateBp,
}: {
  invoice: { id: number; billName: string; billEmail: string | null; billAddress: string | null; dueDate: string | null; notes: string | null };
  lines: { description: string; quantity: number; unitCents: number }[];
  vatRateBp: number;
}) {
  const [state, action, pending] = useActionState(saveDraft, idle);
  const [lines, setLines] = useState<EditLine[]>(() =>
    (initial.length ? initial : [{ description: "", quantity: 1, unitCents: 0 }]).map((l, i) => ({
      key: i,
      description: l.description,
      quantity: String(l.quantity),
      unit: l.unitCents ? toRupees(l.unitCents) : "",
    })),
  );
  const [dirty, setDirty] = useState(false);
  const change = (key: number, patch: Partial<EditLine>) => {
    setDirty(true);
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  };

  const total = useMemo(
    () => lines.reduce((sum, l) => sum + (Math.round(Number(l.unit) * 100) || 0) * (Number(l.quantity) || 0), 0),
    [lines],
  );
  const vat = vatRateBp ? Math.round((total * vatRateBp) / (10000 + vatRateBp)) : 0;

  return (
    <form
      action={async (fd) => {
        await action(fd);
        setDirty(false);
      }}
      onChange={() => setDirty(true)}
      className="card space-y-5 p-5"
    >
      <input type="hidden" name="id" value={invoice.id} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="label">Bill to</span>
          <input name="billName" required minLength={2} defaultValue={invoice.billName} className="field" />
        </label>
        <label>
          <span className="label">Email</span>
          <input name="billEmail" type="email" defaultValue={invoice.billEmail ?? ""} className="field" />
        </label>
        <label>
          <span className="label">Due date <span className="font-normal text-ink-soft">(blank = set on issue)</span></span>
          <input name="dueDate" type="date" defaultValue={invoice.dueDate ?? ""} className="field" />
        </label>
        <label className="sm:col-span-2">
          <span className="label">Address</span>
          <input name="billAddress" defaultValue={invoice.billAddress ?? ""} className="field" />
        </label>
      </div>

      <fieldset className="space-y-2">
        <legend className="label">Lines <span className="font-normal text-ink-soft">(prices in Rs, VAT included; a minus price is a discount)</span></legend>
        {lines.map((l, i) => (
          <div key={l.key} className="grid grid-cols-[1fr_4rem_7rem_auto] items-center gap-2">
            <input name="description" aria-label={`Line ${i + 1} description`} value={l.description} onChange={(e) => change(l.key, { description: e.target.value })} className="field" placeholder="What was done" />
            <input name="quantity" aria-label={`Line ${i + 1} quantity`} inputMode="numeric" value={l.quantity} onChange={(e) => change(l.key, { quantity: e.target.value })} className="field text-right" />
            <input name="unit" aria-label={`Line ${i + 1} price`} inputMode="decimal" value={l.unit} onChange={(e) => change(l.key, { unit: e.target.value })} className="field text-right" placeholder="0" />
            <button
              type="button"
              onClick={() => {
                setDirty(true);
                setLines((ls) => (ls.length > 1 ? ls.filter((x) => x.key !== l.key) : ls));
              }}
              className="grid size-10 place-items-center rounded-full text-xl text-ink-soft hover:bg-surface-alt hover:text-danger"
              aria-label={`Remove line ${i + 1}`}
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            setDirty(true);
            setLines((ls) => [...ls, { key: Math.max(...ls.map((x) => x.key)) + 1, description: "", quantity: "1", unit: "" }]);
          }}
          className="text-sm font-medium text-brand-strong hover:underline"
        >
          + Add line
        </button>
      </fieldset>

      <p className="text-right">
        <span className="text-lg font-bold">Total {fmt(total)}</span>
        {vatRateBp > 0 && <span className="block text-sm text-ink-soft">incl. VAT {fmt(vat)}</span>}
      </p>

      <label className="block">
        <span className="label">Note on the invoice (optional)</span>
        <textarea name="notes" rows={2} defaultValue={invoice.notes ?? ""} className="field" />
      </label>

      {state.status !== "idle" && (
        <p role={state.status === "error" ? "alert" : "status"} className={`rounded-lg px-3 py-2 text-sm font-medium ${state.status === "error" ? "bg-danger/10 text-danger" : "bg-emerald-50 text-emerald-900"}`}>
          {state.message}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-end gap-3">
        {dirty && <span className="text-sm text-amber-700">Unsaved changes</span>}
        <button type="submit" disabled={pending} className="btn-secondary">{pending ? "Saving…" : "Save draft"}</button>
        <button
          type="submit"
          formAction={issueInvoice}
          disabled={pending || dirty || initial.length === 0}
          title={dirty || initial.length === 0 ? "Save your lines first" : undefined}
          onClick={(e) => {
            if (!confirm("Issue this invoice? It gets the next number and can no longer be edited.")) e.preventDefault();
          }}
          className="btn-primary"
        >
          Issue invoice
        </button>
      </div>
      <div className="border-t border-line pt-3 text-right">
        <button
          type="submit"
          formAction={deleteDraft}
          formNoValidate
          onClick={(e) => {
            if (!confirm("Delete this draft?")) e.preventDefault();
          }}
          className="text-sm font-medium text-ink-soft hover:text-danger hover:underline"
        >
          Delete draft
        </button>
      </div>
    </form>
  );
}

export function PaymentForm({ id, balance, today }: { id: number; balance: number; today: string }) {
  const [state, action, pending] = useActionState(recordPayment, idle);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <div className="grid grid-cols-2 gap-3">
        <label>
          <span className="label">Amount (Rs)</span>
          <input name="amount" inputMode="decimal" required defaultValue={toRupees(balance)} className="field" />
        </label>
        <label>
          <span className="label">Received on</span>
          <input name="receivedOn" type="date" required max={today} defaultValue={today} className="field" />
        </label>
        <label>
          <span className="label">Method</span>
          <select name="method" defaultValue="bank_transfer" className="field">
            <option value="bank_transfer">Bank transfer</option>
            <option value="juice">Juice</option>
            <option value="cash">Cash</option>
            <option value="cheque">Cheque</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label>
          <span className="label">Reference</span>
          <input name="reference" placeholder="Optional" className="field" />
        </label>
      </div>
      {state.status !== "idle" && (
        <p role={state.status === "error" ? "alert" : "status"} className={`rounded-lg px-3 py-2 text-sm font-medium ${state.status === "error" ? "bg-danger/10 text-danger" : "bg-emerald-50 text-emerald-900"}`}>
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-primary w-full">{pending ? "Saving…" : "Record payment"}</button>
    </form>
  );
}

export function SendAndShare({ id, link, email, sentAt }: { id: number; link: string; email: string | null; sentAt: string | null }) {
  const [state, action, pending] = useActionState(sendInvoice, idle);
  const [copied, setCopied] = useState(false);
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`Your Clinex Pro invoice: ${link}`)}`;
  return (
    <div className="space-y-3">
      <form action={action}>
        <input type="hidden" name="id" value={id} />
        <button type="submit" disabled={pending || !email} className="btn-primary w-full">
          {pending ? "Sending…" : email ? `Email to ${email}` : "No email address"}
        </button>
      </form>
      {sentAt && state.status === "idle" && <p className="text-xs text-ink-soft">Last emailed {sentAt}.</p>}
      {state.status !== "idle" && (
        <p role={state.status === "error" ? "alert" : "status"} className={`rounded-lg px-3 py-2 text-sm font-medium ${state.status === "error" ? "bg-danger/10 text-danger" : "bg-emerald-50 text-emerald-900"}`}>
          {state.message}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => navigator.clipboard.writeText(link).then(() => setCopied(true))} className="btn-secondary min-h-10 text-sm">
          {copied ? "Link copied" : "Copy link"}
        </button>
        <a href={whatsapp} target="_blank" rel="noopener" className="btn-secondary min-h-10 text-sm">WhatsApp</a>
      </div>
      <a href={link} target="_blank" rel="noopener" className="block text-center text-sm font-medium text-brand-strong hover:underline">Open / print the invoice</a>
    </div>
  );
}

export function VoidForm({ id }: { id: number }) {
  const [state, action, pending] = useActionState(voidInvoice, idle);
  const [open, setOpen] = useState(false);
  if (!open) {
    return <button type="button" onClick={() => setOpen(true)} className="text-sm font-medium text-ink-soft hover:text-danger hover:underline">Void this invoice…</button>;
  }
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <label className="block">
        <span className="label">Why is it being voided?</span>
        <input name="reason" required minLength={3} placeholder="e.g. wrong customer, job cancelled" className="field" />
      </label>
      {state.status === "error" && <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{state.message}</p>}
      <p className="text-xs text-ink-soft">The number stays used and the invoice is kept, marked void. Make a new invoice if needed.</p>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn min-h-10 bg-danger px-4 text-sm text-white">Void invoice</button>
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary min-h-10 text-sm">Cancel</button>
      </div>
    </form>
  );
}
