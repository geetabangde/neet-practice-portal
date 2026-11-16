// How a subject or topic looks (picture and card colour). The database holds names and counts only,
// so the pictures and colours of the subjects that were designed come from data/dashboard.ts, found by
// the subject's slug. Any other subject gets a letter badge and a colour picked from the list below.

import { dashboardSubjects, subjectTopics } from "@/data/dashboard";

// Written out in full so Tailwind can find the class names
const FALLBACK_TONES = [
  "bg-[#ffe6e6]",
  "bg-[#ece8ff]",
  "bg-[#e6eeff]",
  "bg-[#dcfbea]",
  "bg-[#fff3df]",
  "bg-[#fdeaff]",
  "bg-[#d9f8fc]",
];

export function subjectLook(slug: string, id: number): { icon: string | null; toneClass: string } {
  const designed = dashboardSubjects.find((subject) => subject.slug === slug);
  return {
    icon: designed?.icon ?? null,
    toneClass: designed?.toneClass ?? FALLBACK_TONES[id % FALLBACK_TONES.length],
  };
}

// The picture of a topic, when one was designed (only some Biochemistry topics so far)
export function topicLook(subjectSlug: string, topicName: string): { image?: string; fullBleed?: boolean } {
  const designed = subjectTopics[subjectSlug]?.find((topic) => topic.name.toLowerCase() === topicName.toLowerCase());
  return { image: designed?.image, fullBleed: designed?.fullBleed };
}
