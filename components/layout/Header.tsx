import Link from "next/link";
import { navLinks } from "@/data/landing";
import Logo from "@/components/ui/Logo";
import MobileMenu from "./MobileMenu";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-brand-950/95 text-white backdrop-blur">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-7 text-sm text-white/80">
            {navLinks.map((link, i) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`transition-colors hover:text-white ${i === 0 ? "text-accent" : ""}`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          {/* Auth is out of scope for now, so Login points at the trial form */}
          <Link
            href="#trial"
            className="hidden rounded-full border border-white/40 px-4 py-1.5 text-sm font-medium hover:bg-white/10 sm:inline-block"
          >
            Login
          </Link>
          <Link
            href="#trial"
            className="hidden rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-white hover:bg-accent-dark md:inline-block"
          >
            Enroll Now
          </Link>
          <MobileMenu links={navLinks} />
        </div>
      </div>
    </header>
  );
}
