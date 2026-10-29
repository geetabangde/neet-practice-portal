import Image from "next/image";
import Link from "next/link";
import type { DashboardPromo } from "@/types/dashboard";
import { ArrowRightIcon } from "./icons";

type PromoCardProps = {
  promo: DashboardPromo;
  variant: "dark" | "accent";
};

export default function PromoCard({ promo, variant }: PromoCardProps) {
  const dark = variant === "dark";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 text-white ${
        dark ? "bg-black" : "bg-accent"
      }`}
    >
      {dark ? (
        <Image
          src="/test-paper.png"
          alt=""
          width={120}
          height={120}
          className="pointer-events-none absolute -bottom-2 right-1 h-20 w-20 object-contain"
        />
      ) : (
        <span className="absolute right-4 top-4 rounded-full bg-[#ffd400] px-3 py-1 text-[10px] font-bold uppercase text-black">
          Live now
        </span>
      )}
      <h3 className={`font-semibold ${dark ? "text-xl" : "pr-20 text-xl"}`}>{promo.title}</h3>
      <p className={`mt-2 text-xs ${dark ? "max-w-[15rem] text-white/90" : "text-white/90"}`}>
        {promo.description}
      </p>
      <Link
        href={promo.href}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {promo.cta}
        <ArrowRightIcon className="h-4 w-4" />
      </Link>
    </div>
  );
}
