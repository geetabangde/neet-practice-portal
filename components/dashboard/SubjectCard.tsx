import Image from "next/image";
import Link from "next/link";
import type { DashboardSubject } from "@/types/dashboard";

export default function SubjectCard({ subject }: { subject: DashboardSubject }) {
  const { name, slug, icon, completed, total, percent, toneClass } = subject;

  return (
    <li>
      <Link
        href={`/dashboard/${slug}`}
        className={`block rounded-2xl p-4 transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${toneClass}`}
      >
      <div className="flex items-center gap-4">
        <Image
          src={`/subjects/${icon}.png`}
          alt=""
          width={80}
          height={80}
          className="h-12 w-12 shrink-0 object-contain"
        />
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">{name}</h3>
          <p className="text-xs text-black/80">
            {completed}/{total} modules
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div
          role="progressbar"
          aria-label={`${name} progress`}
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-1.5 flex-1 rounded-full bg-black/5"
        >
          <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
        </div>
        <span className="w-9 text-right text-xs font-medium">{percent}%</span>
      </div>
      </Link>
    </li>
  );
}
