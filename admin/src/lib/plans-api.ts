import { apiRequest, type ApiResult } from "@/lib/api";
import type { Plan } from "@/types";

// What the backend sends: the same plan, but with a numeric id
interface ApiPlan extends Omit<Plan, "id"> {
  id: number;
}

// The admin panel keeps ids as strings everywhere, so convert once, here
function toPlan(plan: ApiPlan): Plan {
  return { ...plan, id: String(plan.id) };
}

type PlanFields = Omit<Plan, "id">;

async function mapPlan(request: Promise<ApiResult<{ plan: ApiPlan }>>): Promise<ApiResult<Plan>> {
  const result = await request;
  return result.ok ? { ok: true, data: toPlan(result.data.plan) } : result;
}

export async function fetchPlans(): Promise<ApiResult<Plan[]>> {
  const result = await apiRequest<{ plans: ApiPlan[] }>("/api/admin/plans");
  return result.ok ? { ok: true, data: result.data.plans.map(toPlan) } : result;
}

export function createPlan(fields: PlanFields): Promise<ApiResult<Plan>> {
  return mapPlan(apiRequest("/api/admin/plans", { method: "POST", body: fields }));
}

export function updatePlan(id: string, fields: Partial<PlanFields>): Promise<ApiResult<Plan>> {
  return mapPlan(apiRequest(`/api/admin/plans/${id}`, { method: "PATCH", body: fields }));
}

export function deletePlan(id: string): Promise<ApiResult<null>> {
  return apiRequest<null>(`/api/admin/plans/${id}`, { method: "DELETE" });
}
