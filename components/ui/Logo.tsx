import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  // Tailwind height class for the image; the width follows the aspect ratio
  heightClass?: string;
};

export default function Logo({ heightClass = "h-10" }: LogoProps) {
  return (
    <Link href="#top" aria-label="HN QBank home" className="inline-flex items-center">
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
