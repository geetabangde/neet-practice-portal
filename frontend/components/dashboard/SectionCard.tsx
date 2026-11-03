import type { ReactNode } from "react";

type SectionCardProps = {
  icon: ReactNode;
  title: string;
  subtitle: string;
  // Controls shown on the right of the heading (stepper, "Select All", ...)
  action?: ReactNode;
  children?: ReactNode;
};

// White card with a cyan icon, a title and a one-line hint
export default function SectionCard({ icon, title, subtitle, action, children }: SectionCardProps) {
  return (
    <section className="rounded-xl bg-white p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="text-xs text-slate-700">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
