import type { Difficulty, OptionKey, Question } from "@/types";
import { daysBefore, pad, pick } from "./helpers";
import { topicsData } from "./topics";

// All question text is a clearly labelled "[Demo]" placeholder. Real content comes later.

const difficulties: Difficulty[] = ["easy", "medium", "hard"];
const letters: OptionKey[] = ["A", "B", "C", "D"];

// Two questions per topic, plus a third one for every third topic
const seeds = topicsData.flatMap((topic, topicIndex) =>
  Array.from({ length: 2 + (topicIndex % 3 === 0 ? 1 : 0) }, () => topic),
);

export const questionsData: Question[] = seeds.map((topic, i) => {
  const n = i + 1;
  const multiple = n % 5 === 0;
  const first = pick(letters, n);
  const second = pick(letters, n + 1);

  return {
    id: `q-${pad(n)}`,
    subjectId: topic.subjectId,
    topicId: topic.id,
    text: multiple
      ? `[Demo] Select all statements that are true about ${topic.name}.`
      : `[Demo] Which of the following statements about ${topic.name} is correct?`,
    difficulty: pick(difficulties, n + 1),
    type: multiple ? "multiple" : "single",
    options: { A: "Demo option A", B: "Demo option B", C: "Demo option C", D: "Demo option D" },
    correct: multiple ? [first, second].sort() : [first],
    explanation: `[Demo] Detailed explanation placeholder for question ${n}. Replace with real content.`,
    reference: n % 2 === 0 ? `Demo textbook, chapter ${(n % 12) + 1}` : "Demo reference",
    imageName: n % 9 === 0 ? `demo-image-${n}.png` : "",
    status: n % 8 === 0 ? "draft" : "published",
    // The highest number is the newest question
    createdAt: daysBefore(seeds.length - n),
  };
});
