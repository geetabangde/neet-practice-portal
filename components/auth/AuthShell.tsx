import type { ReactNode } from "react";
import Logo from "@/components/ui/Logo";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

// Page frame shared by /login and /signup: dark background, logo, centred white card
export default function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-brand-950 bg-[radial-gradient(ellipse_at_50%_40%,#0c4a58_0%,#07313b_40%,#04202a_85%)]">
      <header className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6">
        <Logo href="/" />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-4 sm:items-center">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 text-brand-950 shadow-2xl sm:p-8">
          <h1 className="text-center text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-center text-sm text-slate-600">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
