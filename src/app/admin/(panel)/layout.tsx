import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { Icon } from "@/components/icons";
import { AdminNav } from "./admin-nav";
import { logout } from "./actions";

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
        <AdminNav />
        <div className="mt-auto hidden border-t border-line p-4 lg:block">
          <p className="truncate text-sm font-medium">{session.name}</p>
          <p className="truncate text-xs text-ink-soft">{session.email}</p>
          <form action={logout} className="mt-3">
            <button type="submit" className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink">
              <Icon name="logout" width={16} height={16} /> Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
    </div>
  );
}
