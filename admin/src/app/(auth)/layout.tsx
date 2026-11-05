import { BarChart3, ListChecks, Users } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

const highlights = [
  { icon: Users, text: "Students, plans and payments in one place" },
  { icon: ListChecks, text: "Question bank, topics and mock tests" },
  { icon: BarChart3, text: "Results and analytics that show where students struggle" },
];

// Page frame for the sign-in page: a brand panel on the left (large screens) and the form on the right
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-brand-950 bg-[radial-gradient(ellipse_at_50%_40%,#0c4a58_0%,#07313b_45%,#04202a_90%)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden="true" className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <Image src="/logo.png" alt="HN QBank" width={342} height={240} priority className="h-14 w-auto" />
          <span className="leading-tight">
            <span className="block text-base font-semibold">HN QBank</span>
            <span className="block text-xs text-white/60">Admin Console</span>
          </span>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">
            Run the whole NEET PG platform <span className="text-indigo-400">from one place.</span>
          </h2>
          <ul className="mt-8 space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-white/85">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                  <Icon className="h-4 w-4 text-indigo-400" aria-hidden="true" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="flex min-h-screen items-center justify-center bg-tint px-6 py-12">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200/60">{children}</div>
      </main>
    </div>
  );
}
