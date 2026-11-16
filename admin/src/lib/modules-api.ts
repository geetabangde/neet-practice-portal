import { apiRequest, type ApiResult } from "@/lib/api";
import type { Module } from "@/types";

// What the backend sends: the same module, but with numeric ids
interface ApiModule extends Omit<Module, "id" | "subjectId"> {
  id: number;
  subjectId: number;
}

// The admin panel keeps ids as strings everywhere, so convert once, here
function toModule(module: ApiModule): Module {
  return { ...module, id: String(module.id), subjectId: String(module.subjectId) };
}

async function mapModule(request: Promise<ApiResult<{ module: ApiModule }>>): Promise<ApiResult<Module>> {
  const result = await request;
  return result.ok ? { ok: true, data: toModule(result.data.module) } : result;
}

export async function fetchModules(): Promise<ApiResult<Module[]>> {
  const result = await apiRequest<{ modules: ApiModule[] }>("/api/admin/modules");
  return result.ok ? { ok: true, data: result.data.modules.map(toModule) } : result;
}

export function createModule(fields: Pick<Module, "subjectId" | "name" | "status">): Promise<ApiResult<Module>> {
  return mapModule(apiRequest("/api/admin/modules", { method: "POST", body: fields }));
}

// The subject of a module can not change, so only the name and the status can be sent
export function updateModule(id: string, fields: Partial<Pick<Module, "name" | "status">>): Promise<ApiResult<Module>> {
  return mapModule(apiRequest(`/api/admin/modules/${id}`, { method: "PATCH", body: fields }));
}

export function deleteModule(id: string): Promise<ApiResult<null>> {
  return apiRequest<null>(`/api/admin/modules/${id}`, { method: "DELETE" });
}
