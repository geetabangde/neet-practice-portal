import Link from "next/link";
import type { ReactNode } from "react";

type ButtonLinkProps = {
  href: string;
  variant?: "primary" | "outline" | "dark";
  children: ReactNode;
  className?: string;
};

const variants: Record<NonNullable<ButtonLinkProps["variant"]>, string> = {
  primary: "bg-accent text-white hover:bg-accent-dark",
  outline: "border border-white/40 text-white hover:bg-white/10",
  dark: "border border-slate-300 text-brand-950 hover:bg-slate-100",
};

// A link styled as a button; used for CTAs that scroll to a section
export default function ButtonLink({
  href,
  variant = "primary",
  children,
  className = "",
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${variants[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
