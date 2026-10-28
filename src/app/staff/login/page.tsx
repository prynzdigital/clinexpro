import { Logo } from "@/components/logo";
import { BUSINESS } from "@/content/business";
import { StaffLoginForm } from "./login-form";
import { StaffBackdrop } from "../backdrop";
import { deviceStaffLang } from "@/lib/staff-auth";
import { t } from "../i18n";
import { chooseLoginLang } from "./actions";
import { staffTitle } from "../titles";

export const generateMetadata = staffTitle("login");

export default async function StaffLoginPage() {
  const lang = await deviceStaffLang();
  const x = t(lang).login;
  return (
    <main className="relative isolate flex min-h-svh flex-col px-6 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white">
      <StaffBackdrop tone="dark" />
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">
        <form action={chooseLoginLang} className="mb-4 flex justify-end gap-1" aria-label="Language / Langue">
          {(["en", "fr"] as const).map((l) => (
            <button
              key={l}
              name="lang"
              value={l}
              aria-pressed={lang === l}
              lang={l}
              aria-label={l === "en" ? "English" : "Français"}
              className={`min-h-9 rounded-full px-3 text-sm font-bold ${lang === l ? "bg-white text-navy" : "bg-white/10 text-white/80 ring-1 ring-white/15"}`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </form>
        <div className="mb-8 text-center">
          <Logo variant="light" className="mx-auto h-9 w-auto" eager />
          <h1 className="mt-5 text-2xl font-bold">{x.welcome}</h1>
          <p className="mt-1 text-sm text-white/70">{x.intro}</p>
        </div>
        <StaffLoginForm lang={lang} />
        <p className="mt-6 text-center text-xs text-white/60">
          {x.help}<a href={BUSINESS.phoneHref} className="font-semibold text-white underline">{BUSINESS.phone}</a>
        </p>
      </div>
    </main>
  );
}
