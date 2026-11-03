import type { ActivityItem, ChartPoint, StackedPoint } from "@/types";

// Change compared with the previous period, in percent. Negative = went down.
export const statTrends = {
  students: 12.4,
  activeStudents: 8.1,
  questions: 5.6,
  tests: 2.3,
  revenue: 18.7,
  subscriptions: -1.9,
} as const;

export const trendComparison = "vs previous 30 days";

export type RegistrationPeriod = "7d" | "30d" | "12m";

export const registrationPeriods: { value: RegistrationPeriod; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "12m", label: "12 months" },
];

export const registrationOverview: Record<RegistrationPeriod, ChartPoint[]> = {
  "7d": [
    { label: "Mon", value: 14 },
    { label: "Tue", value: 22 },
    { label: "Wed", value: 18 },
    { label: "Thu", value: 31 },
    { label: "Fri", value: 27 },
    { label: "Sat", value: 35 },
    { label: "Sun", value: 29 },
  ],
  "30d": [
    { label: "1 Oct", value: 38 },
    { label: "6 Oct", value: 52 },
    { label: "11 Oct", value: 47 },
    { label: "16 Oct", value: 66 },
    { label: "21 Oct", value: 71 },
    { label: "26 Oct", value: 83 },
  ],
  "12m": [
    { label: "Nov", value: 48 },
    { label: "Dec", value: 56 },
    { label: "Jan", value: 61 },
    { label: "Feb", value: 74 },
    { label: "Mar", value: 69 },
    { label: "Apr", value: 88 },
    { label: "May", value: 95 },
    { label: "Jun", value: 91 },
    { label: "Jul", value: 112 },
    { label: "Aug", value: 124 },
    { label: "Sep", value: 118 },
    { label: "Oct", value: 136 },
  ],
};

export const monthlyRevenue: ChartPoint[] = [
  { label: "Nov", value: 182000 },
  { label: "Dec", value: 210500 },
  { label: "Jan", value: 195000 },
  { label: "Feb", value: 238000 },
  { label: "Mar", value: 224500 },
  { label: "Apr", value: 261000 },
  { label: "May", value: 248000 },
  { label: "Jun", value: 289500 },
  { label: "Jul", value: 301000 },
  { label: "Aug", value: 276500 },
  { label: "Sep", value: 322000 },
  { label: "Oct", value: 348500 },
];

// Two numbers per week: [completed, not finished]
export const attemptSeriesNames = ["Completed", "Not finished"];

export const weeklyAttempts: StackedPoint[] = [
  { label: "W1", values: [120, 22] },
  { label: "W2", values: [138, 19] },
  { label: "W3", values: [152, 28] },
  { label: "W4", values: [149, 24] },
  { label: "W5", values: [171, 31] },
  { label: "W6", values: [188, 27] },
  { label: "W7", values: [176, 25] },
  { label: "W8", values: [203, 30] },
];

export const recentActivities: ActivityItem[] = [
  { id: "a-1", type: "student", text: "Kiara Menon registered a new account", time: "12 minutes ago" },
  { id: "a-2", type: "payment", text: "Payment of ₹28,999 received for Plan C", time: "47 minutes ago" },
  { id: "a-3", type: "test", text: "Grand Test 4 - NEET Pattern was published", time: "2 hours ago" },
  { id: "a-4", type: "question", text: "14 new questions were added to Biochemistry", time: "4 hours ago" },
  { id: "a-5", type: "student", text: "Rohan Mehta completed National INI-CET Mock", time: "Yesterday" },
  { id: "a-6", type: "system", text: "Nightly backup finished successfully", time: "Yesterday" },
  { id: "a-7", type: "payment", text: "Refund processed for one Plan B payment", time: "2 days ago" },
  { id: "a-8", type: "question", text: "3 draft questions are waiting for review", time: "3 days ago" },
];
