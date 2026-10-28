import { requireStaff } from "@/lib/staff-auth";
import { BUSINESS } from "@/content/business";
import { Icon } from "@/components/icons";
import { InstallCard, SignOutButton } from "../app-client";
import { setStaffLang, staffLogout } from "../actions";
import { StaffShell, initials } from "../shell";
import { t } from "../i18n";
import { staffTitle } from "../titles";

export const generateMetadata = staffTitle("me");

export default async function StaffMe() {
  const me = await requireStaff();
  const x = t(me.lang);
  return (
    <StaffShell me={me} tab="me" title={me.name} subtitle={me.phone ?? undefined}>
      <section className="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-sm">
        <span className="grid size-16 shrink-0 place-items-center rounded-full text-xl font-bold text-white" style={{ background: me.color }} aria-hidden>
          {initials(me.name)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">{me.name}</p>
          <p className="text-sm text-ink-soft">{x.me.team} · {x.me.signsIn(me.phone ?? "")}</p>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm" aria-labelledby="lang-title">
        <h2 id="lang-title" className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-soft">
          <Icon name="globe" width={16} height={16} /> {x.me.language}
        </h2>
        <form action={setStaffLang} className="grid grid-cols-2 gap-2 rounded-2xl bg-surface-alt p-1">
          {(["en", "fr"] as const).map((l) => (
            <button
              key={l}
              name="lang"
              value={l}
              aria-pressed={me.lang === l}
              lang={l}
              className={`min-h-12 rounded-xl font-semibold transition-colors ${me.lang === l ? "bg-navy text-white shadow" : "text-ink"}`}
            >
              {l === "en" ? "English" : "Français"}
            </button>
          ))}
        </form>
      </section>

      <InstallCard text={x.install} />

      <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <h2 className="px-5 pt-4 text-sm font-semibold uppercase tracking-wide text-ink-soft">{x.me.office}</h2>
        <ul className="divide-y divide-line">
          <li>
            <a href={BUSINESS.phoneHref} className="flex items-center gap-4 px-5 py-4">
              <span className="grid size-10 place-items-center rounded-full bg-emerald-50 text-emerald-700"><Icon name="phone" width={20} height={20} /></span>
              <span className="flex-1"><span className="block font-semibold">{x.me.callOffice}</span><span className="text-sm text-ink-soft">{BUSINESS.phone}</span></span>
            </a>
          </li>
          <li>
            <a href={BUSINESS.whatsappHref} target="_blank" rel="noopener" className="flex items-center gap-4 px-5 py-4">
              <span className="grid size-10 place-items-center rounded-full bg-green-50 text-green-700"><Icon name="chat" width={20} height={20} /></span>
              <span className="flex-1"><span className="block font-semibold">{x.me.whatsappOffice}</span><span className="text-sm text-ink-soft">{x.me.whatsappHint}</span></span>
            </a>
          </li>
        </ul>
      </section>

      <p className="rounded-2xl bg-white/70 px-4 py-3 text-sm text-ink-soft backdrop-blur-sm">{x.me.pin}</p>

      <SignOutButton action={staffLogout} label={x.me.signOut} />
    </StaffShell>
  );
}
