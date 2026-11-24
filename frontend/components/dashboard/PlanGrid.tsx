"use client";

import { useState } from "react";
import { plans } from "@/data/dashboard";
import { fetchMyPlan } from "@/lib/studentContent";
import { useStudentFetch } from "@/lib/useStudentFetch";
import PlanCard from "./PlanCard";

// The plan cards. The card the student clicks stays highlighted, and the plan the student already has is marked "Active plan".
export default function PlanGrid() {
  const [selected, setSelected] = useState<string | null>(null);
  const { state } = useStudentFetch(fetchMyPlan);
  const activeName = state.status === "ready" && state.data.plan?.active ? state.data.plan.name : null;

  return (
    <div className="mt-8 grid items-stretch gap-6 lg:grid-cols-3 lg:gap-5">
      {plans.map((plan) => (
        <PlanCard
          key={plan.name}
          plan={plan}
          selected={selected === plan.name}
          current={activeName === plan.name}
          onSelect={() => setSelected(plan.name)}
        />
      ))}
    </div>
  );
}
