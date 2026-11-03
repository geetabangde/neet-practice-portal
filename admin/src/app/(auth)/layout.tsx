import { BarChart3, GraduationCap, ListChecks, Users } from "lucide-react";
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
      <aside className="relative hidden overflow-hidden bg-linear-to-br from-indigo-600 via-indigo-700 to-blue-800 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden="true" className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="leading-tight">
            <span className="block text-base font-semibold">NEET PG</span>
            <span className="block text-xs text-indigo-100">Admin Console</span>
          </span>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">
            Run the whole NEET PG platform from one place.
          </h2>
          <ul className="mt-8 space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-indigo-50">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-indigo-100">This is a demo with dummy data. Nothing is saved.</p>
      </aside>

      <main className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
