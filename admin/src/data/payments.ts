import type { Payment, PaymentMethod, PaymentStatus } from "@/types";
import { daysBefore, pad, pick } from "./helpers";
import { plansData } from "./plans";
import { studentsData } from "./students";

const paidPlans = plansData.filter((plan) => plan.price > 0 && plan.status === "active");
const methods: PaymentMethod[] = ["upi", "card", "netbanking", "wallet", "upi", "card"];

function statusFor(i: number): PaymentStatus {
  if (i % 11 === 4) return "failed";
  if (i % 13 === 6) return "pending";
  if (i % 17 === 9) return "refunded";
  return "success";
}

// Made-up transactions. The gateway reference is a placeholder, not a real payment id.
export const paymentsData: Payment[] = Array.from({ length: 34 }, (_, i) => {
  const plan = pick(paidPlans, i);
  const paidAt = daysBefore(i * 2 + 1);
  return {
    id: `TXN-${paidAt.replace(/-/g, "")}-${pad(i + 1, 4)}`,
    studentId: studentsData[(i * 3) % studentsData.length].id,
    planId: plan.id,
    amount: plan.price,
    method: pick(methods, i),
    paidAt,
    status: statusFor(i),
    gatewayRef: `demo_ref_${pad(7400 + i * 13, 5)}`,
  };
});
