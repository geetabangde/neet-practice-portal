import Image from "next/image";
import Link from "next/link";
import type { SubjectTopic } from "@/types/dashboard";

type TopicCardProps = {
  topic: SubjectTopic;
  // Where the card leads, e.g. /dashboard/biochemistry/modules
  href: string;
};

export default function TopicCard({ topic, href }: TopicCardProps) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-4 rounded-xl bg-white p-2 transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
      <div className="flex h-[88px] w-36 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-accent-soft">
        <Image
          src={`/topics/${topic.image}.png`}
          alt=""
          width={400}
          height={400}
          className={topic.fullBleed ? "h-full w-full object-cover" : "h-16 w-28 object-contain"}
        />
      </div>
      <div className="min-w-0">
        <h3 className="text-base font-semibold">{topic.name}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-black/80">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="h-3.5 w-3.5"
          >
            <rect x="6" y="4" width="12" height="17" rx="2" />
            <path d="M9 9h6M9 13h6M9 17h3" />
          </svg>
          {topic.mcqs} MCQs
        </p>
      </div>
      </Link>
    </li>
  );
}
