// Fills the database with sample modules, topics, questions and tests so the student site can be tried out.
//   npm run seed:demo             adds the sample data (safe to run again: nothing is added twice)
//   npm run seed:demo -- --remove removes only the sample data again
//
// The structure is subject > module > topic. Every sample question and test starts with "[Demo]", and every
// question says in its text which option is correct, so it is easy to check that marking works.
// Your own data is never changed. It needs the ten starter subjects (npm run seed:subjects).
// Do not run it on the live site.
import "dotenv/config";
import type { RowDataPacket } from "mysql2";
import { pool } from "../config/db";
import { createModule, isDuplicateModule, type ModuleStatus } from "../services/module.service";
import { createQuestion, type Difficulty, type OptionKey, type QuestionInput } from "../services/question.service";
import { createTest, type TestStatus } from "../services/test.service";
import { createTopic, isDuplicateTopic } from "../services/topic.service";

const DEMO_PREFIX = "[Demo]";

// Two modules per subject, two real topic names in each
const CURRICULUM: Record<string, { module: string; topics: string[] }[]> = {
  Anatomy: [
    { module: "Limbs", topics: ["Upper Limb", "Lower Limb"] },
    { module: "Thorax and Nervous System", topics: ["Thorax", "Neuroanatomy"] },
  ],
  Physiology: [
    { module: "General and Excitable Tissue", topics: ["General Physiology", "Nerve and Muscle"] },
    { module: "Organ Systems", topics: ["Cardiovascular System", "Renal Physiology"] },
  ],
  Biochemistry: [
    { module: "Biomolecules", topics: ["Carbohydrates", "Amino Acids and Proteins"] },
    { module: "Lipids and Enzymes", topics: ["Lipids", "Enzymes"] },
  ],
  Pathology: [
    { module: "Basics", topics: ["General Pathology", "Neoplasia"] },
    { module: "Systemic Pathology", topics: ["Haematology", "Cardiovascular Pathology"] },
  ],
  Pharmacology: [
    { module: "Basics and ANS", topics: ["General Pharmacology", "Autonomic Nervous System"] },
    { module: "Drug Classes", topics: ["Antimicrobials", "CNS Drugs"] },
  ],
  Microbiology: [
    { module: "Fundamentals", topics: ["General Microbiology", "Immunology"] },
    { module: "Organisms", topics: ["Bacteriology", "Virology"] },
  ],
  "Community Medicine": [
    { module: "Methods", topics: ["Epidemiology", "Biostatistics"] },
    { module: "Public Health", topics: ["Preventive Medicine", "Health Programmes"] },
  ],
  Ophthalmology: [
    { module: "Structure and Optics", topics: ["Anatomy of the Eye", "Refractive Errors"] },
    { module: "Eye Diseases", topics: ["Glaucoma", "Retina"] },
  ],
  Anaesthesia: [
    { module: "General and Local", topics: ["General Anaesthesia", "Local Anaesthesia"] },
    { module: "Airway and Drugs", topics: ["Airway Management", "Muscle Relaxants"] },
  ],
  Psychiatry: [
    { module: "Mood and Psychosis", topics: ["Mood Disorders", "Psychotic Disorders"] },
    { module: "Anxiety and Substance Use", topics: ["Anxiety Disorders", "Substance Use"] },
  ],
};

// Things the student site must hide, to try those rules (all in Anatomy)
const HIDDEN = {
  subject: "Anatomy",
  // an inactive topic inside an active module
  inactiveTopic: { module: "Limbs", name: "Demo Inactive Topic" },
  // an inactive module: its topics are hidden too, even though the topic itself is active
  inactiveModule: { name: "Demo Inactive Module", topic: "Hidden Topic" },
};

const QUESTIONS_PER_TOPIC = 5;
const LETTERS: OptionKey[] = ["A", "B", "C", "D"];
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

// ---- helpers --------------------------------------------------------------------------------

async function subjectsByName(): Promise<Map<string, number>> {
  const [rows] = await pool.query<(RowDataPacket & { id: number; name: string })[]>("SELECT id, name FROM subjects");
  return new Map(rows.map((row) => [row.name, row.id]));
}

async function findModule(subjectId: number, name: string): Promise<number | null> {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT id FROM modules WHERE subject_id = ? AND name = ?", [subjectId, name]);
  return (rows[0]?.id as number | undefined) ?? null;
}

async function findTopic(moduleId: number, name: string): Promise<number | null> {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT id FROM topics WHERE module_id = ? AND name = ?", [moduleId, name]);
  return (rows[0]?.id as number | undefined) ?? null;
}

// The id of the module; made if it does not exist yet. "created" says whether this call made it.
async function ensureModule(subjectId: number, name: string, status: ModuleStatus): Promise<{ id: number; created: boolean }> {
  const existing = await findModule(subjectId, name);
  if (existing !== null) return { id: existing, created: false };
  try {
    return { id: (await createModule({ subjectId, name, status })).id, created: true };
  } catch (error) {
    if (!isDuplicateModule(error)) throw error;
    return { id: (await findModule(subjectId, name)) as number, created: false };
  }
}

async function ensureTopic(moduleId: number, name: string, status: "active" | "inactive"): Promise<{ id: number; created: boolean }> {
  const existing = await findTopic(moduleId, name);
  if (existing !== null) return { id: existing, created: false };
  try {
    return { id: (await createTopic({ moduleId, name, status })).id, created: true };
  } catch (error) {
    if (!isDuplicateTopic(error)) throw error;
    return { id: (await findTopic(moduleId, name)) as number, created: false };
  }
}

// The id of a question with this exact text, made first if needed
async function ensureQuestion(input: QuestionInput): Promise<{ id: number; created: boolean }> {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT id FROM questions WHERE question_text = ? LIMIT 1", [input.text]);
  if (rows[0]) return { id: rows[0].id as number, created: false };
  return { id: (await createQuestion(input)).id, created: true };
}

// "2026-11-14T09:00": today plus some days, at the given hour
function when(daysFromToday: number, hour: number, minute = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(hour)}:${pad(minute)}`;
}

// ---- add ----------------------------------------------------------------------------------

function demoQuestion(
  where: { subject: string; module: string; topic: string },
  ids: { subjectId: number; topicId: number },
  n: number,
  multiple: boolean,
): QuestionInput {
  const first = LETTERS[(n - 1) % 4];
  const second = LETTERS[(n + 1) % 4];
  const correct = (multiple ? [first, second] : [first]).sort() as OptionKey[];
  const answerWords = multiple ? `options ${correct.join(" and ")}` : `option ${first}`;

  return {
    subjectId: ids.subjectId,
    topicId: ids.topicId,
    text: `${DEMO_PREFIX} ${where.subject} > ${where.module} > ${where.topic}: question ${n}. Choose ${answerWords}.`,
    difficulty: DIFFICULTIES[(n - 1) % 3],
    type: multiple ? "multiple" : "single",
    options: { A: `Option A (${where.topic})`, B: `Option B (${where.topic})`, C: `Option C (${where.topic})`, D: `Option D (${where.topic})` },
    correct,
    explanation: `Demo explanation: ${answerWords} ${multiple ? "are" : "is"} correct for this sample question.`,
    reference: "Demo data",
    imageName: "",
    status: "published",
  };
}

async function add(): Promise<void> {
  const subjects = await subjectsByName();
  const missing = Object.keys(CURRICULUM).filter((name) => !subjects.has(name));
  if (missing.length > 0) console.warn(`Skipped (subject not found, run npm run seed:subjects): ${missing.join(", ")}`);

  const counts = { modules: 0, topics: 0, questions: 0, tests: 0 };
  // For building the tests: the questions and topics made for each subject, in order
  const questionsBySubject = new Map<string, number[]>();
  const topicsBySubject = new Map<string, number[]>();

  for (const [subject, modules] of Object.entries(CURRICULUM)) {
    const subjectId = subjects.get(subject);
    if (subjectId === undefined) continue;
    questionsBySubject.set(subject, []);
    topicsBySubject.set(subject, []);

    for (const [moduleIndex, moduleDef] of modules.entries()) {
      const module = await ensureModule(subjectId, moduleDef.module, "active");
      if (module.created) counts.modules += 1;

      for (const [topicIndex, topicName] of moduleDef.topics.entries()) {
        const topic = await ensureTopic(module.id, topicName, "active");
        if (topic.created) counts.topics += 1;
        topicsBySubject.get(subject)?.push(topic.id);

        for (let n = 1; n <= QUESTIONS_PER_TOPIC; n += 1) {
          // The very first topic of each subject gets one "multiple correct" question, to try that type
          const multiple = n === QUESTIONS_PER_TOPIC && moduleIndex === 0 && topicIndex === 0;
          const made = await ensureQuestion(
            demoQuestion({ subject, module: moduleDef.module, topic: topicName }, { subjectId, topicId: topic.id }, n, multiple),
          );
          if (made.created) counts.questions += 1;
          questionsBySubject.get(subject)?.push(made.id);
        }
      }
    }
  }

  // The things the student site must hide
  const hiddenSubjectId = subjects.get(HIDDEN.subject);
  if (hiddenSubjectId !== undefined) {
    const where = (module: string, topic: string) => ({ subject: HIDDEN.subject, module, topic });

    const limbs = await findModule(hiddenSubjectId, HIDDEN.inactiveTopic.module);
    if (limbs !== null) {
      const inactive = await ensureTopic(limbs, HIDDEN.inactiveTopic.name, "inactive");
      if (inactive.created) counts.topics += 1;
      for (let n = 1; n <= 2; n += 1) {
        const q = demoQuestion(where(HIDDEN.inactiveTopic.module, HIDDEN.inactiveTopic.name), { subjectId: hiddenSubjectId, topicId: inactive.id }, n, false);
        if ((await ensureQuestion(q)).created) counts.questions += 1;
      }

      const upperLimb = await findTopic(limbs, "Upper Limb");
      if (upperLimb !== null) {
        for (let n = 1; n <= 2; n += 1) {
          const draft: QuestionInput = {
            ...demoQuestion(where("Limbs", "Upper Limb"), { subjectId: hiddenSubjectId, topicId: upperLimb }, n, false),
            text: `${DEMO_PREFIX} Anatomy > Limbs > Upper Limb: DRAFT question ${n} (students must not see this).`,
            status: "draft",
          };
          if ((await ensureQuestion(draft)).created) counts.questions += 1;
        }
      }
    }

    const hiddenModule = await ensureModule(hiddenSubjectId, HIDDEN.inactiveModule.name, "inactive");
    if (hiddenModule.created) counts.modules += 1;
    const hiddenTopic = await ensureTopic(hiddenModule.id, HIDDEN.inactiveModule.topic, "active");
    if (hiddenTopic.created) counts.topics += 1;
    for (let n = 1; n <= 2; n += 1) {
      const q = demoQuestion(where(HIDDEN.inactiveModule.name, HIDDEN.inactiveModule.topic), { subjectId: hiddenSubjectId, topicId: hiddenTopic.id }, n, false);
      if ((await ensureQuestion(q)).created) counts.questions += 1;
    }
  }

  // Tests. Published and completed tests hold only published questions, as the admin panel requires.
  const pick = (names: string[], perSubject: number) => names.flatMap((name) => (questionsBySubject.get(name) ?? []).slice(0, perSubject));
  const topicsOf = (names: string[]) => names.flatMap((name) => topicsBySubject.get(name) ?? []);
  const idsOf = (names: string[]) => names.flatMap((name) => (subjects.has(name) ? [subjects.get(name) as number] : []));
  const allSubjects = Object.keys(CURRICULUM).filter((name) => subjects.has(name));

  const tests: { title: string; status: TestStatus; subjects: string[]; perSubject: number; minutes: number; start: string; end: string }[] = [
    { title: `${DEMO_PREFIX} Grand Test 1 - NEET Pattern`, status: "completed", subjects: allSubjects, perSubject: 5, minutes: 180, start: when(-30, 9), end: when(-30, 12) },
    { title: `${DEMO_PREFIX} Grand Test 2 - INICET Pattern`, status: "published", subjects: allSubjects, perSubject: 5, minutes: 180, start: when(-1, 9), end: when(30, 23, 59) },
    { title: `${DEMO_PREFIX} Grand Test 3 - NEET Pattern`, status: "published", subjects: allSubjects, perSubject: 5, minutes: 180, start: when(7, 9), end: when(7, 12) },
    { title: `${DEMO_PREFIX} Anatomy Subject Test`, status: "published", subjects: ["Anatomy"], perSubject: 20, minutes: 30, start: when(-1, 9), end: when(30, 23, 59) },
    { title: `${DEMO_PREFIX} Biochemistry Subject Test`, status: "published", subjects: ["Biochemistry"], perSubject: 20, minutes: 30, start: when(-1, 9), end: when(30, 23, 59) },
    { title: `${DEMO_PREFIX} Mini Test - Mixed (draft)`, status: "draft", subjects: ["Physiology", "Pathology", "Pharmacology"], perSubject: 4, minutes: 20, start: when(3, 9), end: when(3, 10) },
  ];

  for (const test of tests) {
    const names = test.subjects.filter((name) => subjects.has(name));
    if (names.length === 0) continue;
    const [existing] = await pool.query<RowDataPacket[]>("SELECT id FROM tests WHERE title = ? LIMIT 1", [test.title]);
    if (existing.length > 0) continue;
    await createTest({
      title: test.title,
      description: "Sample test for trying out the student site.",
      subjectIds: idsOf(names),
      topicIds: topicsOf(names),
      questionIds: pick(names, test.perSubject),
      durationMinutes: test.minutes,
      marksPerQuestion: 4,
      negativeMarking: 1,
      startAt: test.start,
      endAt: test.end,
      status: test.status,
    });
    counts.tests += 1;
  }

  console.log(`Demo data added: ${counts.modules} modules, ${counts.topics} topics, ${counts.questions} questions, ${counts.tests} tests.`);
  if (counts.modules + counts.topics + counts.questions + counts.tests === 0) console.log("(Everything was already there, so nothing was added.)");
}

// ---- remove -------------------------------------------------------------------------------

async function remove(): Promise<void> {
  // Tests first, then questions (a question leaves the tests that use it by itself), then empty demo topics, then empty demo modules
  const [tests] = await pool.query("DELETE FROM tests WHERE title LIKE ?", [`${DEMO_PREFIX}%`]);
  const [questions] = await pool.query("DELETE FROM questions WHERE question_text LIKE ?", [`${DEMO_PREFIX}%`]);

  const subjects = await subjectsByName();
  const demoModules: { subject: string; name: string; topics: string[] }[] = [
    ...Object.entries(CURRICULUM).flatMap(([subject, modules]) => modules.map((m) => ({ subject, name: m.module, topics: m.topics }))),
    { subject: HIDDEN.subject, name: HIDDEN.inactiveModule.name, topics: [HIDDEN.inactiveModule.topic] },
  ];
  // The inactive topic sits inside the first Anatomy module
  const limbs = demoModules.find((m) => m.subject === HIDDEN.subject && m.name === HIDDEN.inactiveTopic.module);
  limbs?.topics.push(HIDDEN.inactiveTopic.name);

  let topicsRemoved = 0;
  let modulesRemoved = 0;
  const count = (result: unknown) => (typeof result === "object" && result !== null && "affectedRows" in result ? Number(result.affectedRows) : 0);

  for (const demoModule of demoModules) {
    const subjectId = subjects.get(demoModule.subject);
    if (subjectId === undefined) continue;
    for (const topicName of demoModule.topics) {
      // A topic that still holds someone's own questions stays
      const [result] = await pool.query(
        `DELETE t FROM topics t JOIN modules m ON m.id = t.module_id
         WHERE m.subject_id = ? AND m.name = ? AND t.name = ? AND NOT EXISTS (SELECT 1 FROM questions q WHERE q.topic_id = t.id)`,
        [subjectId, demoModule.name, topicName],
      );
      topicsRemoved += count(result);
    }
    // A module that still holds a topic (someone's own) stays
    const [result] = await pool.query(
      "DELETE FROM modules WHERE subject_id = ? AND name = ? AND NOT EXISTS (SELECT 1 FROM topics t WHERE t.module_id = modules.id)",
      [subjectId, demoModule.name],
    );
    modulesRemoved += count(result);
  }

  console.log(`Demo data removed: ${count(tests)} tests, ${count(questions)} questions, ${topicsRemoved} topics, ${modulesRemoved} modules.`);
}

const removing = process.argv.includes("--remove");

(removing ? remove() : add())
  .catch((error: unknown) => {
    console.error("Seed failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
