import type { Request, Response } from "express";
import { activatePlan, getStudentPlan, isDemoPayment } from "../services/student-plan.service";

const studentIdOf = (res: Response) => (res.locals.student as { id: number }).id;

// GET /api/student/plan  ->  the plan the student has now (plan is null when there is none)
export async function getMyPlanHandler(_req: Request, res: Response): Promise<void> {
  try {
    res.json({ success: true, message: "Plan", data: { plan: await getStudentPlan(studentIdOf(res)) } });
  } catch (error) {
    console.error("Get plan failed:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
}

// POST /api/student/plan/purchase   body: { "plan": "Plan C", "months": 12 }
// Demo payment: no money is taken. Without PAYMENT_MODE=demo the server says payment is not set up.
export async function purchasePlanHandler(req: Request, res: Response): Promise<void> {
  if (!isDemoPayment()) {
    res.status(501).json({ success: false, message: "Online payment is not set up yet." });
    return;
  }
  const body = (typeof req.body === "object" && req.body !== null ? req.body : {}) as { plan?: unknown; months?: unknown; amount?: unknown };
  const plan = typeof body.plan === "string" ? body.plan.trim() : "";
  const months = body.months;
  if (!plan || typeof months !== "number" || !Number.isInteger(months) || months < 1 || months > 60) {
    res.status(400).json({ success: false, message: "Send the plan name and the number of months (1 to 60)." });
    return;
  }
  try {
    const amount = typeof body.amount === "number" ? body.amount : undefined;
    const outcome = await activatePlan(studentIdOf(res), plan, months, amount);
    if (!outcome.ok) res.status(outcome.status).json({ success: false, message: outcome.message });
    else res.json({ success: true, message: "Plan activated", data: { plan: outcome.plan } });
  } catch (error) {
    console.error("Purchase plan failed:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
}
