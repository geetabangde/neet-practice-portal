import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <>
      {/* The brand panel is hidden on small screens, so the logo is repeated here */}
      <div className="mb-8 flex items-center gap-3 lg:hidden">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-blue-600 text-white">
          <GraduationCap className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="text-base font-semibold text-slate-900">NEET PG Admin</span>
      </div>

      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
      <p className="mb-8 mt-2 text-sm text-slate-500">Sign in to manage students, questions and tests.</p>

      <LoginForm />
    </>
  );
}
