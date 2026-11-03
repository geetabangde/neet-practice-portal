import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  // Tailwind height class for the image; the width follows the aspect ratio
  heightClass?: string;
  // "#top" on the landing page, "/" on other pages
  href?: string;
};

export default function Logo({ heightClass = "h-10", href = "#top" }: LogoProps) {
  return (
    <Link href={href} aria-label="HN QBank home" className="inline-flex items-center">
      <Image
        src="/logo.png"
        alt="HN QBank"
        width={342}
        height={240}
        priority
        className={`${heightClass} w-auto`}
      />
    </Link>
  );
}
