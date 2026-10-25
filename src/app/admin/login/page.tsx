import Image from "next/image";
import { Logo } from "@/components/logo";
import { LoginForm } from "./login-form";
import background from "../../../../public/images/admin-login.jpg";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="relative isolate grid min-h-svh place-items-center overflow-hidden px-4 py-10">
      <Image src={background} alt="" fill priority sizes="100vw" className="-z-20 object-cover" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-br from-navy/55 via-navy/25 to-navy/60" />

      <div className="w-full max-w-sm rounded-[1.75rem] border border-white/50 bg-white/55 p-7 shadow-[0_30px_80px_-20px_rgba(3,20,50,0.55),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-2xl backdrop-saturate-150 sm:p-8">
        <div className="mb-7 text-center">
          <Logo className="mx-auto h-9 w-auto" priority />
          <p className="mt-3 text-sm font-medium text-ink-soft">Admin dashboard</p>
        </div>
        <LoginForm />
      </div>

      <p className="absolute inset-x-0 bottom-5 text-center text-xs text-white/80">
        © {new Date().getFullYear()} Clinex Pro Contracting Ltd
      </p>
    </div>
  );
}
