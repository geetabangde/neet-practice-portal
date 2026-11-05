import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <>
      {/* The brand panel is hidden on small screens, so the logo is repeated here */}
      <div className="mb-6 flex items-center gap-3 rounded-xl bg-brand-950 px-4 py-2 lg:hidden">
        <Image src="/logo.png" alt="HN QBank" width={342} height={240} className="h-10 w-auto" />
        <span className="text-sm font-semibold text-white">HN QBank Admin</span>
      </div>

      <h1 className="text-3xl font-semibold tracking-tight text-brand-950">Welcome back</h1>
      <p className="mb-8 mt-2 text-sm text-slate-500">Sign in to manage students, questions and tests.</p>

      <LoginForm />
    </>
  );
}
