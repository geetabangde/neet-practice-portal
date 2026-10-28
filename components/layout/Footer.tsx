import Image from "next/image";
import Link from "next/link";
import { footerColumns } from "@/data/landing";
import { MailIcon, PhoneIcon } from "@/components/ui/Icons";
import Logo from "@/components/ui/Logo";

const socials = ["facebook", "linkedin", "instagram", "youtube"] as const;

export default function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="mx-auto max-w-5xl px-4 pt-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-[270fr_117fr_111fr_128fr_130fr] md:gap-4">
          <div>
            <Logo heightClass="h-14" />
            <p className="mt-4 max-w-56 text-[11px] leading-relaxed">
              Question Bank, Test Series And Revision For NEET PG And FMGE.
            </p>
          </div>

          {footerColumns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-sm font-semibold">{col.title}</h3>
              <ul className="mt-4 space-y-2 text-[10px]">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="hover:text-accent">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <h3 className="text-sm font-semibold">Contact Us</h3>
            <ul className="mt-4 space-y-2 text-[10px]">
              <li className="flex items-center gap-2">
                <PhoneIcon className="h-3 w-3 shrink-0" />
                +91 76567 88977
              </li>
              <li className="flex items-center gap-2">
                <MailIcon className="h-3 w-3 shrink-0" />
                Hn@Gmail.Com
              </li>
            </ul>
            {/* Placeholder links: replace with the real profile URLs */}
            <ul className="mt-4 flex gap-2.5">
              {socials.map((name) => (
                <li key={name}>
                  <a href="#top" aria-label={name} className="block transition-opacity hover:opacity-80">
                    <Image src={`/social/${name}.png`} alt="" width={50} height={50} className="h-6 w-6" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-6 border-t border-white/25 py-4 text-center text-[10px]">
          © 2026 HN QBank. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
