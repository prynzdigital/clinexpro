import { Logo } from "@/components/logo";
import { StaffLoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default function StaffLoginPage() {
  return (
    <main className="grid min-h-svh place-items-center bg-navy px-4 py-10">
      <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-xl">
        <div className="mb-6 text-center">
          <Logo className="mx-auto h-9 w-auto" eager />
          <h1 className="mt-3 text-lg font-bold">Staff app</h1>
          <p className="text-sm text-ink-soft">Your jobs for today, directions and check-in.</p>
        </div>
        <StaffLoginForm />
        <p className="mt-5 text-center text-xs text-ink-soft">No PIN or forgot it? Ask the office for a new one.</p>
      </div>
    </main>
  );
}
