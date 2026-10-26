import { requireAdmin } from "@/lib/auth";
import { PASSWORD_MIN_LENGTH } from "@/lib/passwords";
import { PageHeader, label } from "../ui";
import { PasswordForm } from "./password-form";

export const metadata = { title: "My account" };

export default async function AccountPage({ searchParams }: PageProps<"/admin/account">) {
  const session = await requireAdmin();
  const { changed } = await searchParams;

  return (
    <>
      <PageHeader title="My account" subtitle={`${session.name} · ${session.email} · ${label(session.role)}`} />
      <section className="card max-w-lg space-y-4 p-6">
        <h2 className="font-semibold">Change password</h2>
        {changed && (
          <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
            Password changed. Any other device signed in to this account has been signed out.
          </p>
        )}
        <PasswordForm minLength={PASSWORD_MIN_LENGTH} />
      </section>
    </>
  );
}
