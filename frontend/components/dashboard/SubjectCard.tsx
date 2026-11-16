import Image from "next/image";
import Link from "next/link";

// What one card shows. The dashboard builds it from the subjects the server sends.
export type SubjectCardData = {
  name: string;
  slug: string;
  // Picture file name in public/subjects. null = no picture was designed, a letter badge is shown instead.
  icon: string | null;
  // Full Tailwind background class, written out so Tailwind can find it
  toneClass: string;
  // The small line under the name, e.g. "6 topics · 120 MCQs"
  caption: string;
  percent: number;
};

export default function SubjectCard({ subject }: { subject: SubjectCardData }) {
  const { name, slug, icon, caption, percent, toneClass } = subject;

  return (
    <li>
      <Link
        href={`/dashboard/${slug}`}
        className={`block rounded-2xl p-4 transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${toneClass}`}
      >
      <div className="flex items-center gap-4">
        {icon ? (
          <Image
            src={`/subjects/${icon}.png`}
            alt=""
            width={80}
            height={80}
            className="h-12 w-12 shrink-0 object-contain"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/70 text-xl font-bold text-accent-dark"
          >
            {name.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">{name}</h3>
          <p className="text-xs text-black/80">{caption}</p>
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
