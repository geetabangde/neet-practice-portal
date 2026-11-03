import CoursePlans from "@/components/sections/CoursePlans";
import { plans } from "@/data/dashboard";

function LaurelCrest({ className = "h-14 w-auto" }: { className?: string }) {
  return (
    <div className="mb-4 flex justify-center">
      <svg
        viewBox="0 0 120 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="hnGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="40%" stopColor="#facc15" />
            <stop offset="80%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>
        </defs>

        {/* Laurel Wreath */}
        <g fill="url(#hnGold)">
          {/* Outer leaves left */}
          <ellipse cx="28" cy="14" rx="5" ry="2.2" transform="rotate(-40 28 14)" />
          <ellipse cx="22" cy="23" rx="5.5" ry="2.4" transform="rotate(-25 22 23)" />
          <ellipse cx="19" cy="33" rx="6" ry="2.5" transform="rotate(-5 19 33)" />
          <ellipse cx="21" cy="44" rx="6" ry="2.6" transform="rotate(18 21 44)" />
          <ellipse cx="27" cy="54" rx="5.5" ry="2.5" transform="rotate(38 27 54)" />
          <ellipse cx="36" cy="61" rx="5" ry="2.3" transform="rotate(58 36 61)" />
          <ellipse cx="46" cy="65" rx="4.5" ry="2.2" transform="rotate(78 46 65)" />

          {/* Inner leaves left */}
          <ellipse cx="35" cy="20" rx="4.5" ry="2" transform="rotate(20 35 20)" />
          <ellipse cx="32" cy="30" rx="5" ry="2.1" transform="rotate(32 32 30)" />
          <ellipse cx="33" cy="41" rx="5" ry="2.2" transform="rotate(45 33 41)" />
          <ellipse cx="39" cy="50" rx="4.8" ry="2" transform="rotate(58 39 50)" />

          {/* Branch stem left */}
          <path
            d="M 28 16 C 18 30 18 48 48 66"
            stroke="url(#hnGold)"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />

          {/* Outer leaves right */}
          <ellipse cx="92" cy="14" rx="5" ry="2.2" transform="rotate(40 92 14)" />
          <ellipse cx="98" cy="23" rx="5.5" ry="2.4" transform="rotate(25 98 23)" />
          <ellipse cx="101" cy="33" rx="6" ry="2.5" transform="rotate(5 101 33)" />
          <ellipse cx="99" cy="44" rx="6" ry="2.6" transform="rotate(-18 99 44)" />
          <ellipse cx="93" cy="54" rx="5.5" ry="2.5" transform="rotate(-38 93 54)" />
          <ellipse cx="84" cy="61" rx="5" ry="2.3" transform="rotate(-58 84 61)" />
          <ellipse cx="74" cy="65" rx="4.5" ry="2.2" transform="rotate(-78 74 65)" />

          {/* Inner leaves right */}
          <ellipse cx="85" cy="20" rx="4.5" ry="2" transform="rotate(-20 85 20)" />
          <ellipse cx="88" cy="30" rx="5" ry="2.1" transform="rotate(-32 88 30)" />
          <ellipse cx="87" cy="41" rx="5" ry="2.2" transform="rotate(-45 87 41)" />
          <ellipse cx="81" cy="50" rx="4.8" ry="2" transform="rotate(-58 81 50)" />

          {/* Branch stem right */}
          <path
            d="M 92 16 C 102 30 102 48 72 66"
            stroke="url(#hnGold)"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />

          {/* Center bottom tie */}
          <circle cx="60" cy="66" r="2.2" />
        </g>

        {/* Center HN Monogram */}
        <text
          x="60"
          y="38"
          textAnchor="middle"
          dominantBaseline="central"
          fill="url(#hnGold)"
          fontSize="24"
          fontWeight="800"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="1.5"
        >
          HN
        </text>

        {/* Underline bar */}
        <line
          x1="50"
          y1="49"
          x2="70"
          y2="49"
          stroke="url(#hnGold)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

// The three plans shown on the /courses page, styled after the premium Marrow layout reference
export default function CoursesSection() {
  return (
    <section
      id="courses"
      aria-labelledby="courses-heading"
      className="bg-brand-900 bg-[radial-gradient(ellipse_at_50%_0%,#115869_0%,#0b4452_60%,#062831_100%)] px-4 py-12 text-white sm:px-6 sm:py-16"
    >
      <div className="mx-auto max-w-6xl">
        <LaurelCrest className="h-16 w-auto" />

        <h1
          id="courses-heading"
          className="text-center text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
        >
          The Gold Standard for NEET PG &ndash; NExT
        </h1>

        <CoursePlans plans={plans} />
      </div>
    </section>
  );
}
