import Link from "next/link";
import { navLinks } from "@/data/landing";
import Logo from "@/components/ui/Logo";
import MobileMenu from "./MobileMenu";
import NavLinks from "./NavLinks";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-brand-950/95 text-white backdrop-blur">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo href="/" />

        <NavLinks links={navLinks} />

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden rounded-full border border-white/40 px-4 py-1.5 text-sm font-medium hover:bg-white/10 sm:inline-block"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="hidden rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-brand-950 hover:bg-white/90 md:inline-block"
          >
            Enroll Now
          </Link>
          <MobileMenu links={navLinks} />
        </div>
      </div>
    </header>
  );
}
