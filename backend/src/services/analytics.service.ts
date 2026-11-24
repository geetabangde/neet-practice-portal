import type { RowDataPacket } from "mysql2/promise";
import { pool } from "../config/db";

export type DateRange = "7d" | "30d" | "90d" | "12m";

export const DATE_RANGES: readonly DateRange[] = ["7d", "30d", "90d", "12m"];

export interface ChartPoint {
  label: string;
  value: number;
}

export interface Kpi {
  label: string;
  value: number;
  // "number" is shown as it is, "percent" with a % sign, "currency" in rupees
  format: "number" | "percent" | "currency";
  // Change compared with the period before: percent for counts and money, percentage points for the average score
  change: number;
}

export interface Analytics {
  kpis: Kpi[];
  studentGrowth: ChartPoint[];
  testParticipation: ChartPoint[];
  averageScores: ChartPoint[];
  revenue: ChartPoint[];
  subjectPerformance: ChartPoint[];
  topicPerformance: ChartPoint[];
  questionAccuracy: ChartPoint[];
}

const DAY = 86_400_000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Days are handled as whole numbers (days since 1970), so there is no time zone to get wrong
const dayNumber = (text: string): number => {
  const [year, month, day] = text.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / DAY);
};
const monthNumber = (text: string): number => {
  const [year, month] = text.split("-").map(Number);
  return year * 12 + (month - 1);
};
const dateOf = (day: number) => new Date(day * DAY);
const isoOf = (day: number) => dateOf(day).toISOString().slice(0, 10);

// How the period is cut into points on the chart
interface Period {
  // First day of this period, first day of the period before it, and today
  start: number;
  previousStart: number;
  today: number;
  labels: string[];
  // Which point a day falls in (-1: outside this period)
  pointOf: (day: number) => number;
}

function periodFor(range: DateRange): Period {
  const now = new Date();
  const today = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / DAY);

  if (range === "12m") {
    const firstMonth = now.getFullYear() * 12 + now.getMonth() - 11;
    const startOf = (months: number) => Math.floor(Date.UTC(Math.floor(months / 12), months % 12, 1) / DAY);
    return {
      start: startOf(firstMonth),
      previousStart: startOf(firstMonth - 12),
      today,
      labels: Array.from({ length: 12 }, (_, i) => MONTHS[(firstMonth + i) % 12]),
      pointOf: (day) => {
        const index = monthNumber(isoOf(day)) - firstMonth;
        return index >= 0 && index < 12 ? index : -1;
      },
    };
  }

  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const points = range === "7d" ? 7 : range === "30d" ? 10 : 12;
  const start = today - (days - 1);
  const labels = Array.from({ length: points }, (_, i) => {
    const firstDay = start + Math.floor((i * days) / points);
    if (range === "7d") return WEEKDAYS[dateOf(firstDay).getUTCDay()];
    if (range === "90d") return `W${i + 1}`;
    return `${dateOf(firstDay).getUTCDate()} ${MONTHS[dateOf(firstDay).getUTCMonth()]}`;
  });
  return {
    start,
    previousStart: start - days,
    today,
    labels,
    pointOf: (day) => (day >= start && day <= today ? Math.floor(((day - start) * points) / days) : -1),
  };
}

// Change compared with the period before, in percent. Nothing before and something now counts as +100%.
function percentChange(now: number, before: number): number {
  if (before === 0) return now > 0 ? 100 : 0;
  return Math.round(((now - before) / before) * 1000) / 10;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

interface DatedRow extends RowDataPacket {
  day: string;
}

export async function getAnalytics(range: DateRange): Promise<Analytics> {
  const period = periodFor(range);
  const since = isoOf(period.previousStart);
  const currentStart = isoOf(period.start);

  const [studentRows] = await pool.query<DatedRow[]>("SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day FROM students WHERE created_at >= ?", [since]);
  const [attemptRows] = await pool.query<(DatedRow & { score: string; total: string })[]>(
    "SELECT DATE_FORMAT(submitted_at, '%Y-%m-%d') AS day, score, total_marks AS total FROM test_attempts WHERE submitted_at IS NOT NULL AND submitted_at >= ?",
    [since],
  );
  const [purchaseRows] = await pool.query<(DatedRow & { amount: number })[]>(
    "SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day, amount FROM plan_purchases WHERE created_at >= ?",
    [since],
  );

  const pointsCount = period.labels.length;
  const zeros = () => Array.from({ length: pointsCount }, () => 0);
  const split = <T extends DatedRow>(rows: T[]) => {
    const current: { point: number; row: T }[] = [];
    const before: T[] = [];
    for (const row of rows) {
      const day = dayNumber(row.day);
      if (day >= period.start && day <= period.today) current.push({ point: period.pointOf(day), row });
      else if (day >= period.previousStart && day < period.start) before.push(row);
    }
    return { current, before };
  };

  const students = split(studentRows);
  const attempts = split(attemptRows);
  const purchases = split(purchaseRows);

  const studentCounts = zeros();
  for (const { point } of students.current) studentCounts[point] += 1;
  const attemptCounts = zeros();
  const scoreSums = zeros();
  // Marks as a percent of the total, never below 0 (wrong answers can take the score under 0)
  const percentOf = (row: { score: string; total: string }) => (Number(row.total) > 0 ? Math.max(0, (Number(row.score) / Number(row.total)) * 100) : 0);
  for (const { point, row } of attempts.current) {
    attemptCounts[point] += 1;
    scoreSums[point] += percentOf(row);
  }
  const revenueSums = zeros();
  for (const { point, row } of purchases.current) revenueSums[point] += row.amount;

  const average = (rows: { score: string; total: string }[]) => (rows.length ? rows.reduce((sum, row) => sum + percentOf(row), 0) / rows.length : 0);
  const averageNow = average(attempts.current.map((entry) => entry.row));
  const averageBefore = average(attempts.before);
  const sum = (rows: { amount: number }[]) => rows.reduce((total, row) => total + row.amount, 0);

  // Subject, topic and difficulty come from the QBank practice answers (student_answers) of this period: the Test Series
  // questions are written inside each test and have no subject or topic. Every answer counts once per student and question.
  const [answerRows] = await pool.query<(RowDataPacket & { isCorrect: number; subject: string | null; topic: string | null; difficulty: string })[]>(
    `SELECT sa.is_correct AS isCorrect, s.name AS subject, t.name AS topic, q.difficulty
       FROM student_answers sa
       JOIN questions q ON q.id = sa.question_id
       LEFT JOIN subjects s ON s.id = q.subject_id
       LEFT JOIN topics t ON t.id = q.topic_id
      WHERE sa.answered_at >= ?`,
    [currentStart],
  );
  const tally = (key: (row: (typeof answerRows)[number]) => string | null) => {
    const map = new Map<string, { right: number; total: number }>();
    for (const row of answerRows) {
      const name = key(row);
      if (name === null) continue;
      const entry = map.get(name) ?? { right: 0, total: 0 };
      entry.total += 1;
      if (row.isCorrect === 1) entry.right += 1;
      map.set(name, entry);
    }
    return map;
  };
  const toPoints = (map: Map<string, { right: number; total: number }>): (ChartPoint & { total: number })[] =>
    [...map].map(([label, entry]) => ({ label, value: Math.round((entry.right / entry.total) * 100), total: entry.total }));

  const subjectPerformance = toPoints(tally((row) => row.subject)).map(({ label, value }) => ({ label, value }));
  // The ten topics students answered most
  const topicPerformance = toPoints(tally((row) => row.topic))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
    .map(({ label, value }) => ({ label, value }));
  const difficulty = tally((row) => row.difficulty);
  const questionAccuracy = (["easy", "medium", "hard"] as const)
    .filter((level) => difficulty.has(level))
    .map((level) => {
      const entry = difficulty.get(level) as { right: number; total: number };
      return { label: level[0].toUpperCase() + level.slice(1), value: Math.round((entry.right / entry.total) * 100) };
    });

  const points = (values: number[]): ChartPoint[] => period.labels.map((label, i) => ({ label, value: values[i] }));

  return {
    kpis: [
      { label: "New students", value: students.current.length, format: "number", change: percentChange(students.current.length, students.before.length) },
      { label: "Test attempts", value: attempts.current.length, format: "number", change: percentChange(attempts.current.length, attempts.before.length) },
      { label: "Average score", value: Math.round(averageNow), format: "percent", change: attempts.before.length ? round1(averageNow - averageBefore) : 0 },
      { label: "Revenue", value: sum(purchases.current.map((e) => e.row)), format: "currency", change: percentChange(sum(purchases.current.map((e) => e.row)), sum(purchases.before)) },
    ],
    studentGrowth: points(studentCounts),
    testParticipation: points(attemptCounts),
    averageScores: points(scoreSums.map((total, i) => (attemptCounts[i] ? Math.round(total / attemptCounts[i]) : 0))),
    revenue: points(revenueSums),
    subjectPerformance,
    topicPerformance,
    questionAccuracy,
  };
}
