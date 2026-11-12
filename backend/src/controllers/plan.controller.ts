import type { Request, Response } from "express";
import {
  createPlan,
  deletePlan,
  getPlan,
  isDuplicatePlan,
  listPlans,
  replacePlan,
  type Plan,
  type PlanInput,
  type PlanStatus,
} from "../services/plan.service";

type Parsed = { ok: true; value: Partial<PlanInput> } | { ok: false; message: string };

const bad = (message: string): Parsed => ({ ok: false, message });

const MAX_PRICE = 10_000_000;
const MAX_MONTHS = 120;
const MAX_FEATURES = 20;
const FEATURE_LIMIT = 200;

// "12" or 12 -> 12; anything else -> null
function toId(raw: unknown): number | null {
  const id = typeof raw === "string" && /^\d+$/.test(raw) ? Number(raw) : typeof raw === "number" ? raw : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// Checks the type and size of every field that was sent
function parseFields(body: unknown): Parsed {
  if (typeof body !== "object" || body === null) return bad("Send the plan details as JSON");
  const data = body as Record<string, unknown>;
  const value: Partial<PlanInput> = {};

  if (data.name !== undefined) {
    if (typeof data.name !== "string" || data.name.trim() === "") return bad("Enter the plan name");
    if (data.name.trim().length > 100) return bad("Plan name must be 100 characters or fewer");
    value.name = data.name.trim();
  }
  if (data.price !== undefined) {
    const price = data.price;
    if (typeof price !== "number" || !Number.isInteger(price) || price < 0 || price > MAX_PRICE) {
      return bad("Price must be a whole number of rupees (0 for a free plan)");
    }
    value.price = price;
  }
  if (data.durationMonths !== undefined) {
    const months = toId(data.durationMonths);
    if (months === null || months > MAX_MONTHS) return bad(`Duration must be a whole number of months, from 1 to ${MAX_MONTHS}`);
    value.durationMonths = months;
  }
  if (data.features !== undefined) {
    if (!Array.isArray(data.features) || data.features.some((feature) => typeof feature !== "string")) {
      return bad("Features must be a list of text lines");
    }
    // Blank lines are dropped
    const features = (data.features as string[]).map((feature) => feature.trim()).filter(Boolean);
    if (features.length > MAX_FEATURES) return bad(`A plan can have at most ${MAX_FEATURES} features`);
    if (features.some((feature) => feature.length > FEATURE_LIMIT)) return bad(`Each feature must be ${FEATURE_LIMIT} characters or fewer`);
    value.features = features;
  }
  if (data.status !== undefined) {
    if (data.status !== "active" && data.status !== "inactive") return bad("Status must be active or inactive");
    value.status = data.status as PlanStatus;
  }
  return { ok: true, value };
}

// The rules for a finished plan, the same ones the admin form applies
function problemWith(plan: Partial<PlanInput>): string | null {
  if (!plan.name) return "Enter the plan name";
  if (plan.price === undefined) return "Enter a price (0 for a free plan)";
  if (plan.durationMonths === undefined) return "Enter the duration in months";
  if (!plan.features || plan.features.length === 0) return "Add at least one feature";
  return null;
}

const NOT_FOUND = { success: false, message: "Plan not found" };
const DUPLICATE = { success: false, message: "A plan with this name already exists" };
const FAILED = { success: false, message: "Something went wrong" };

export async function listPlansHandler(_req: Request, res: Response): Promise<void> {
  try {
    res.json({ success: true, message: "Plans", data: { plans: await listPlans() } });
  } catch (error) {
    console.error("List plans failed:", error);
    res.status(500).json(FAILED);
  }
}

export async function getPlanHandler(req: Request, res: Response): Promise<void> {
  const id = toId(req.params.id);
  if (id === null) {
    res.status(404).json(NOT_FOUND);
    return;
  }
  try {
    const plan = await getPlan(id);
    if (!plan) res.status(404).json(NOT_FOUND);
    else res.json({ success: true, message: "Plan", data: { plan } });
  } catch (error) {
    console.error("Get plan failed:", error);
    res.status(500).json(FAILED);
  }
}

export async function createPlanHandler(req: Request, res: Response): Promise<void> {
  const parsed = parseFields(req.body);
  if (!parsed.ok) {
    res.status(400).json({ success: false, message: parsed.message });
    return;
  }
  const plan: Partial<PlanInput> = { status: "active", ...parsed.value };
  const problem = problemWith(plan);
  if (problem) {
    res.status(400).json({ success: false, message: problem });
    return;
  }
  try {
    res.status(201).json({ success: true, message: "Plan created", data: { plan: await createPlan(plan as PlanInput) } });
  } catch (error) {
    if (isDuplicatePlan(error)) {
      res.status(409).json(DUPLICATE);
      return;
    }
    console.error("Create plan failed:", error);
    res.status(500).json(FAILED);
  }
}

// PATCH: send only the fields that change. They are merged into the saved plan, and the merged
// result must pass the same rules as a new plan.
export async function updatePlanHandler(req: Request, res: Response): Promise<void> {
  const id = toId(req.params.id);
  if (id === null) {
    res.status(404).json(NOT_FOUND);
    return;
  }
  const parsed = parseFields(req.body);
  if (!parsed.ok) {
    res.status(400).json({ success: false, message: parsed.message });
    return;
  }
  try {
    const current: Plan | null = await getPlan(id);
    if (!current) {
      res.status(404).json(NOT_FOUND);
      return;
    }
    const { id: _id, ...currentFields } = current;
    const merged: PlanInput = { ...currentFields, ...parsed.value };
    const problem = problemWith(merged);
    if (problem) {
      res.status(400).json({ success: false, message: problem });
      return;
    }
    await replacePlan(id, merged);
    res.json({ success: true, message: "Plan updated", data: { plan: await getPlan(id) } });
  } catch (error) {
    if (isDuplicatePlan(error)) {
      res.status(409).json(DUPLICATE);
      return;
    }
    console.error("Update plan failed:", error);
    res.status(500).json(FAILED);
  }
}

export async function deletePlanHandler(req: Request, res: Response): Promise<void> {
  const id = toId(req.params.id);
  if (id === null) {
    res.status(404).json(NOT_FOUND);
    return;
  }
  try {
    const removed = await deletePlan(id);
    if (!removed) res.status(404).json(NOT_FOUND);
    else res.json({ success: true, message: "Plan deleted" });
  } catch (error) {
    console.error("Delete plan failed:", error);
    res.status(500).json(FAILED);
  }
}
