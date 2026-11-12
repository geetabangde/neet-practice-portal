import { apiRequest, type ApiResult } from "@/lib/api";
import type { Subject } from "@/types";

// What the backend sends: the same subject, but with a numeric id
interface ApiSubject extends Omit<Subject, "id"> {
  id: number;
}

// The admin panel keeps ids as strings everywhere, so convert once, here
function toSubject(subject: ApiSubject): Subject {
  return { ...subject, id: String(subject.id) };
}

type SubjectFields = Pick<Subject, "name" | "description" | "icon" | "status">;

async function mapSubject(request: Promise<ApiResult<{ subject: ApiSubject }>>): Promise<ApiResult<Subject>> {
  const result = await request;
  return result.ok ? { ok: true, data: toSubject(result.data.subject) } : result;
}

export async function fetchSubjects(): Promise<ApiResult<Subject[]>> {
  const result = await apiRequest<{ subjects: ApiSubject[] }>("/api/admin/subjects");
  return result.ok ? { ok: true, data: result.data.subjects.map(toSubject) } : result;
}

export function createSubject(fields: SubjectFields): Promise<ApiResult<Subject>> {
  return mapSubject(apiRequest("/api/admin/subjects", { method: "POST", body: fields }));
}

export function updateSubject(id: string, fields: Partial<SubjectFields>): Promise<ApiResult<Subject>> {
  return mapSubject(apiRequest(`/api/admin/subjects/${id}`, { method: "PATCH", body: fields }));
}

export function deleteSubject(id: string): Promise<ApiResult<null>> {
  return apiRequest<null>(`/api/admin/subjects/${id}`, { method: "DELETE" });
}
