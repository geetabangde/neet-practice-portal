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
