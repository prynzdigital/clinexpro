import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { PASSWORD_MIN_LENGTH } from "@/lib/passwords";
import { Logo } from "@/components/logo";
import { Icon } from "@/components/icons";
import { AdminNav } from "./admin-nav";
import { logout } from "./actions";
import { PasswordForm } from "./account/password-form";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="bg-navy text-white print:hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:flex-col">
        <div className="flex h-16 items-center justify-between px-4 lg:h-20 lg:px-6">
          <Link href="/admin" aria-label="Clinex Pro admin home"><Logo variant="light" /></Link>
          <form action={logout} className="lg:hidden">
            <button type="submit" className="grid size-10 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white" aria-label="Sign out">
              <Icon name="logout" width={20} height={20} />
            </button>
          </form>
        </div>
        <AdminNav role={session.role} />
        <div className="mt-auto hidden border-t border-white/10 p-4 lg:block">
          <Link href="/admin/account" className="flex items-center gap-3 rounded-xl p-2 hover:bg-white/10">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold" aria-hidden>
              {session.name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{session.name}</span>
              <span className="block truncate text-xs text-white/60">{session.email}</span>
            </span>
          </Link>
          <form action={logout} className="mt-2 px-2">
            <button type="submit" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white">
              <Icon name="logout" width={16} height={16} /> Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 bg-surface-alt px-4 py-6 sm:px-8 sm:py-8 print:bg-white print:p-0">
        {session.mustChangePassword ? (
          // Signed in with a password someone else chose: nothing else until they pick their own.
          <section className="card mx-auto max-w-lg space-y-4 p-6">
            <h1 className="text-2xl font-bold tracking-tight">Choose your password</h1>
            <p className="text-sm text-ink-soft">
              Welcome, {session.name.split(" ")[0]}. You signed in with a temporary password; choose your own to continue.
            </p>
            <PasswordForm minLength={PASSWORD_MIN_LENGTH} firstTime />
          </section>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
