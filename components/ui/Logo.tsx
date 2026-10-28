import Link from "next/link";

// Text-based placeholder for the HN logo (swap for the real asset when exported from Figma)
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="#top"
      aria-label="HN QBank home"
      className={`inline-flex items-center gap-2 ${className}`}
    >
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-sm font-extrabold text-brand-950">
        HN
      </span>
      <span className="text-lg font-bold tracking-tight">QBank</span>
    </Link>
  );
}
