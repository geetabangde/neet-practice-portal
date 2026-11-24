"use client";

import { fetchMyPlan } from "@/lib/studentContent";
import { useStudentFetch } from "@/lib/useStudentFetch";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function niceDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

// Tells the student which plan is active on the Plans screen. Shows nothing while loading or when there is no plan.
export default function CurrentPlanBanner() {
  const { state } = useStudentFetch(fetchMyPlan);
  if (state.status !== "ready" || !state.data.plan) return null;
  const plan = state.data.plan;

  return (
    <p
      role="status"
      className={`mx-auto mt-4 w-fit rounded-full px-5 py-2 text-xs font-semibold ${plan.active ? "bg-green-100 text-green-800" : "bg-rose-50 text-rose-700"}`}
    >
      {plan.active ? "Your plan" : "Your plan ended"}: {plan.name}
      {plan.expiresAt ? (plan.active ? ` · active until ${niceDate(plan.expiresAt)}` : ` · ended on ${niceDate(plan.expiresAt)}`) : ""}
    </p>
  );
}
