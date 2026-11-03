import type { ChartPoint, DateRange } from "@/types";

export const rangeLabels: Record<DateRange, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "12m": "Last 12 months",
};

export const rangeOptions = (Object.keys(rangeLabels) as DateRange[]).map((value) => ({
  value,
  label: rangeLabels[value],
}));

export interface AnalyticsKpi {
  label: string;
  value: number;
  // "number" is shown as it is, "percent" with a % sign, "currency" in rupees
  format: "number" | "percent" | "currency";
  // Change compared with the period before, in percent
  change: number;
}

export interface AnalyticsData {
  kpis: AnalyticsKpi[];
  studentGrowth: ChartPoint[];
  testParticipation: ChartPoint[];
  averageScores: ChartPoint[];
  revenue: ChartPoint[];
  subjectPerformance: ChartPoint[];
  topicPerformance: ChartPoint[];
  questionAccuracy: ChartPoint[];
}

const MONTHS = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];

const labelsFor: Record<DateRange, string[]> = {
  "7d": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  "30d": ["3 Oct", "6 Oct", "9 Oct", "12 Oct", "15 Oct", "18 Oct", "21 Oct", "24 Oct", "27 Oct", "30 Oct"],
  "90d": Array.from({ length: 12 }, (_, i) => `W${i + 1}`),
  "12m": MONTHS,
};

// Starting value and growth per point for each range
const shape: Record<DateRange, { base: number; step: number }> = {
  "7d": { base: 14, step: 2 },
  "30d": { base: 38, step: 5 },
  "90d": { base: 90, step: 9 },
  "12m": { base: 48, step: 8 },
};

const rangeIndex: Record<DateRange, number> = { "7d": 0, "30d": 1, "90d": 2, "12m": 3 };

// A rising line with small ups and downs, using integer maths only
function series(range: DateRange, base: number, step: number, wobble: number): ChartPoint[] {
  return labelsFor[range].map((label, i) => ({
    label,
    value: base + step * i + ((i * wobble) % 7) * Math.max(1, Math.round(step / 2)),
  }));
}

const subjectBase: [string, number][] = [
  ["Anatomy", 71],
  ["Physiology", 64],
  ["Biochemistry", 68],
  ["Pathology", 59],
  ["Pharmacology", 62],
  ["Microbiology", 66],
  ["Community Medicine", 74],
  ["Ophthalmology", 70],
  ["Anaesthesia", 61],
  ["Psychiatry", 57],
];

const topicBase: [string, number][] = [
  ["Epidemiology", 84],
  ["Biostatistics", 79],
  ["Upper Limb", 76],
  ["Carbohydrates", 72],
  ["Cardiovascular System", 69],
  ["Immunology", 64],
  ["Glaucoma", 58],
  ["Chemotherapy", 52],
  ["Neuroanatomy", 47],
  ["Lipids", 44],
];

export function getAnalytics(range: DateRange): AnalyticsData {
  const r = rangeIndex[range];
  const { base, step } = shape[range];

  const studentGrowth = series(range, base, step, 5);
  const revenue = studentGrowth.map((point, i) => ({
    label: point.label,
    value: point.value * 2450 + ((i * 3) % 5) * 1800,
  }));
  const total = (points: ChartPoint[]) => points.reduce((sum, p) => sum + p.value, 0);

  return {
    kpis: [
      { label: "New students", value: total(studentGrowth), format: "number", change: 12.4 - r },
      { label: "Test attempts", value: total(studentGrowth) * 6, format: "number", change: 8.7 + r },
      { label: "Average score", value: 62 + r, format: "percent", change: 3.2 },
      { label: "Revenue", value: total(revenue), format: "currency", change: 18.7 - r * 2 },
    ],
    studentGrowth,
    testParticipation: series(range, base * 5, step * 4, 3),
    averageScores: labelsFor[range].map((label, i) => ({ label, value: 56 + r + ((i * 3) % 6) + Math.floor(i / 2) })),
    revenue,
    subjectPerformance: subjectBase.map(([label, value], i) => ({ label, value: value + ((r * 2 + i) % 5) - 2 })),
    topicPerformance: topicBase.map(([label, value], i) => ({ label, value: value + ((r + i) % 3) - 1 })),
    questionAccuracy: [
      { label: "Easy", value: 82 + (r % 2) },
      { label: "Medium", value: 64 - (r % 3) },
      { label: "Hard", value: 41 + (r % 4) },
    ],
  };
}
