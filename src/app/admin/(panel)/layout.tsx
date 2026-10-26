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
      <aside className="border-b border-line bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:flex-col lg:border-r lg:border-b-0">
        <div className="flex h-16 items-center justify-between px-4 lg:px-5">
          <Link href="/admin"><Logo /></Link>
          <form action={logout} className="lg:hidden">
            <button type="submit" className="grid size-10 place-items-center rounded-full text-ink-soft hover:bg-surface-alt" aria-label="Sign out">
              <Icon name="logout" width={20} height={20} />
            </button>
          </form>
        </div>
        <AdminNav role={session.role} />
        <div className="mt-auto hidden border-t border-line p-4 lg:block">
          <Link href="/admin/account" className="block rounded-lg hover:text-brand-strong">
            <span className="block truncate text-sm font-medium">{session.name}</span>
            <span className="block truncate text-xs text-ink-soft">{session.email}</span>
          </Link>
          <form action={logout} className="mt-3">
            <button type="submit" className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink">
              <Icon name="logout" width={16} height={16} /> Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">
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
