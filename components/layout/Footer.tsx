import Link from "next/link";
import { footerColumns } from "@/data/landing";
import Logo from "@/components/ui/Logo";
import { SocialIcon } from "@/components/ui/Icons";

const socials = ["facebook", "instagram", "linkedin", "youtube"] as const;

export default function Footer() {
  return (
    <footer className="bg-brand-950 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)_1.2fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-xs text-white/60">
            Question Bank, Test Series And Revision For NEET PG And FMGE.
          </p>
        </div>

        {footerColumns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="text-sm font-semibold">{col.title}</h3>
            <ul className="mt-4 space-y-2 text-xs text-white/60">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <h3 className="text-sm font-semibold">Contact Us</h3>
          <ul className="mt-4 space-y-2 text-xs text-white/60">
            <li>+91 76587 88977</li>
            <li>hn@gmail.com</li>
          </ul>
          {/* Placeholder links: replace with the real profile URLs */}
          <ul className="mt-4 flex gap-3">
            {socials.map((kind) => (
              <li key={kind}>
                <a
                  href="#top"
                  aria-label={kind}
                  className="grid h-8 w-8 place-items-center rounded-full bg-accent text-brand-950 hover:bg-white"
                >
                  <SocialIcon kind={kind} className="h-4 w-4" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © 2026 HN QBank. All Rights Reserved.
      </p>
    </footer>
  );
}
