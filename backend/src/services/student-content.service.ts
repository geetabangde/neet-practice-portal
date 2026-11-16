import type { RowDataPacket } from "mysql2";
import { pool } from "../config/db";

// What a signed-in student sees: only active subjects, modules and topics, and only published questions.
// A topic is hidden when its module is switched off, even if the topic itself is active.
export interface StudentSubject {
  id: number;
  name: string;
  // Used in the website address: /dashboard/<slug>
  slug: string;
  description: string;
  moduleCount: number;
  topicCount: number;
  questionCount: number;
  // How many of those questions this student has answered (progress)
  answeredCount: number;
}

export interface StudentTopic {
  id: number;
  name: string;
  questionCount: number;
  answeredCount: number;
}

export interface StudentModule {
  id: number;
  name: string;
  questionCount: number;
  answeredCount: number;
  topics: StudentTopic[];
}

interface SubjectRow extends RowDataPacket {
  id: number;
  name: string;
  description: string;
  moduleCount: number | string;
  topicCount: number | string;
  questionCount: number | string;
  answeredCount: number | string;
}

interface ModuleTopicRow extends RowDataPacket {
  moduleId: number;
  moduleName: string;
  topicId: number | null;
  topicName: string | null;
  questionCount: number | string;
  answeredCount: number | string;
}

// "Community Medicine" -> "community-medicine". Computed from the name, so the admin never has to type it.
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Active subjects, oldest first, with this student's progress
export async function listStudentSubjects(studentId: number): Promise<StudentSubject[]> {
  const [rows] = await pool.query<SubjectRow[]>(
    `SELECT s.id, s.name, s.description,
       (SELECT COUNT(*) FROM modules m WHERE m.subject_id = s.id AND m.status = 'active') AS moduleCount,
       (SELECT COUNT(*) FROM topics t JOIN modules m ON m.id = t.module_id
         WHERE t.subject_id = s.id AND t.status = 'active' AND m.status = 'active') AS topicCount,
       (SELECT COUNT(*) FROM questions q JOIN topics t ON t.id = q.topic_id JOIN modules m ON m.id = t.module_id
         WHERE t.subject_id = s.id AND t.status = 'active' AND m.status = 'active' AND q.status = 'published') AS questionCount,
       (SELECT COUNT(*) FROM student_answers a JOIN questions q ON q.id = a.question_id JOIN topics t ON t.id = q.topic_id JOIN modules m ON m.id = t.module_id
         WHERE a.student_id = ? AND t.subject_id = s.id AND t.status = 'active' AND m.status = 'active' AND q.status = 'published') AS answeredCount
     FROM subjects s WHERE s.status = 'active' ORDER BY s.id ASC`,
    [studentId],
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: slugify(row.name),
    description: row.description,
    // COUNT(*) can come back as text, so make sure the website gets numbers
    moduleCount: Number(row.moduleCount),
    topicCount: Number(row.topicCount),
    questionCount: Number(row.questionCount),
    answeredCount: Number(row.answeredCount),
  }));
}

export async function findStudentSubjectBySlug(slug: string, studentId: number): Promise<StudentSubject | null> {
  const subjects = await listStudentSubjects(studentId);
  return subjects.find((subject) => subject.slug === slug) ?? null;
}

// The active modules of a subject, each with its active topics and their published question counts
export async function listStudentModules(subjectId: number, studentId: number): Promise<StudentModule[]> {
  const [rows] = await pool.query<ModuleTopicRow[]>(
    `SELECT m.id AS moduleId, m.name AS moduleName, t.id AS topicId, t.name AS topicName, COUNT(q.id) AS questionCount,
       COUNT(a.question_id) AS answeredCount
     FROM modules m
     LEFT JOIN topics t ON t.module_id = m.id AND t.status = 'active'
     LEFT JOIN questions q ON q.topic_id = t.id AND q.status = 'published'
     LEFT JOIN student_answers a ON a.question_id = q.id AND a.student_id = ?
     WHERE m.subject_id = ? AND m.status = 'active'
     GROUP BY m.id, m.name, t.id, t.name
     ORDER BY m.id ASC, t.id ASC`,
    [studentId, subjectId],
  );

  const modules = new Map<number, StudentModule>();
  for (const row of rows) {
    const module = modules.get(row.moduleId) ?? { id: row.moduleId, name: row.moduleName, questionCount: 0, answeredCount: 0, topics: [] };
    // A module with no active topic still comes back once (its topic columns are empty)
    if (row.topicId !== null && row.topicName !== null) {
      const questionCount = Number(row.questionCount);
      const answeredCount = Number(row.answeredCount);
      module.topics.push({ id: row.topicId, name: row.topicName, questionCount, answeredCount });
      module.questionCount += questionCount;
      module.answeredCount += answeredCount;
    }
    modules.set(row.moduleId, module);
  }
  return [...modules.values()];
}
