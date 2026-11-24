import { navLinks } from "@/data/landing";
import Logo from "@/components/ui/Logo";
import AuthButtons from "./AuthButtons";
import MobileMenu from "./MobileMenu";
import NavLinks from "./NavLinks";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-brand-950/95 text-white backdrop-blur">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo href="/" />

        <NavLinks links={navLinks} />

        <div className="flex items-center gap-3">
          <AuthButtons />
          <MobileMenu links={navLinks} />
        </div>
      </div>
    </header>
  );
}
