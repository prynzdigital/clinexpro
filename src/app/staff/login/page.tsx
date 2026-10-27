import { Logo } from "@/components/logo";
import { BUSINESS } from "@/content/business";
import { StaffLoginForm } from "./login-form";
import { StaffBackdrop } from "../backdrop";

export const metadata = { title: "Sign in" };

export default function StaffLoginPage() {
  return (
    <main className="relative isolate flex min-h-svh flex-col px-6 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white">
      <StaffBackdrop tone="dark" />
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">
        <div className="mb-8 text-center">
          <Logo variant="light" className="mx-auto h-9 w-auto" eager />
          <h1 className="mt-5 text-2xl font-bold">Welcome back</h1>
          <p className="mt-1 text-sm text-white/70">Sign in to see your jobs for today.</p>
        </div>
        <StaffLoginForm />
        <p className="mt-6 text-center text-xs text-white/60">
          No PIN or forgot it? Ask the office: <a href={BUSINESS.phoneHref} className="font-semibold text-white underline">{BUSINESS.phone}</a>
        </p>
      </div>
    </main>
  );
}
