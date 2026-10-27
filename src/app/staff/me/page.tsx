import { requireStaff } from "@/lib/staff-auth";
import { BUSINESS } from "@/content/business";
import { Icon } from "@/components/icons";
import { InstallCard, SignOutButton } from "../app-client";
import { staffLogout } from "../actions";
import { StaffShell, initials } from "../shell";

export const metadata = { title: "Me" };

export default async function StaffMe() {
  const me = await requireStaff();
  return (
    <StaffShell me={me} tab="me" title={me.name} subtitle={me.phone ?? undefined}>
      <section className="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-sm">
        <span className="grid size-16 shrink-0 place-items-center rounded-full text-xl font-bold text-white" style={{ background: me.color }} aria-hidden>
          {initials(me.name)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">{me.name}</p>
          <p className="text-sm text-ink-soft">Clinex Pro team · signs in with {me.phone}</p>
        </div>
      </section>

      <InstallCard />

      <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <h2 className="px-5 pt-4 text-sm font-semibold uppercase tracking-wide text-ink-soft">The office</h2>
        <ul className="divide-y divide-line">
          <li>
            <a href={BUSINESS.phoneHref} className="flex items-center gap-4 px-5 py-4">
              <span className="grid size-10 place-items-center rounded-full bg-emerald-50 text-emerald-700"><Icon name="phone" width={20} height={20} /></span>
              <span className="flex-1"><span className="block font-semibold">Call the office</span><span className="text-sm text-ink-soft">{BUSINESS.phone}</span></span>
            </a>
          </li>
          <li>
            <a href={BUSINESS.whatsappHref} target="_blank" rel="noopener" className="flex items-center gap-4 px-5 py-4">
              <span className="grid size-10 place-items-center rounded-full bg-green-50 text-green-700"><Icon name="chat" width={20} height={20} /></span>
              <span className="flex-1"><span className="block font-semibold">WhatsApp the office</span><span className="text-sm text-ink-soft">Running late, a problem on site…</span></span>
            </a>
          </li>
        </ul>
      </section>

      <p className="rounded-2xl bg-white/70 px-4 py-3 text-sm text-ink-soft backdrop-blur-sm">Forgot your PIN or changed phone? Ask the office for a new PIN; the old one stops working straight away.</p>

      <SignOutButton action={staffLogout} />
    </StaffShell>
  );
}
