import { Logo } from "@/components/logo";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Logo />
          <p className="mt-2 text-sm text-ink-soft">Admin dashboard</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
