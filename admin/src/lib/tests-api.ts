import { apiRequest, type ApiResult } from "@/lib/api";
import type { MockTest } from "@/types";

// What the backend sends: the same test, but with a numeric id
interface ApiTest extends Omit<MockTest, "id"> {
  id: number;
}

// The admin panel keeps ids as strings everywhere, so convert once, here
function toTest(test: ApiTest): MockTest {
  return { ...test, id: String(test.id) };
}

// Everything a test has, apart from its id and the two numbers the server works out
export type TestFields = Omit<MockTest, "id" | "questionCount" | "sectionCount" | "negativeMarking">;

// What making a test needs: only the basics. A new test starts as a draft with no questions; they are written afterwards.
export type TestBasics = Pick<MockTest, "title" | "description" | "kind" | "durationMinutes" | "marksPerQuestion" | "negativeRatio" | "startAt" | "endAt">;

async function mapTest(request: Promise<ApiResult<{ test: ApiTest }>>): Promise<ApiResult<MockTest>> {
  const result = await request;
  return result.ok ? { ok: true, data: toTest(result.data.test) } : result;
}

export async function fetchTests(): Promise<ApiResult<MockTest[]>> {
  const result = await apiRequest<{ tests: ApiTest[] }>("/api/admin/tests");
  return result.ok ? { ok: true, data: result.data.tests.map(toTest) } : result;
}

export function createTest(fields: TestBasics): Promise<ApiResult<MockTest>> {
  return mapTest(apiRequest("/api/admin/tests", { method: "POST", body: fields }));
}

export function updateTest(id: string, fields: Partial<TestFields>): Promise<ApiResult<MockTest>> {
  return mapTest(apiRequest(`/api/admin/tests/${id}`, { method: "PATCH", body: fields }));
}

export function deleteTest(id: string): Promise<ApiResult<null>> {
  return apiRequest<null>(`/api/admin/tests/${id}`, { method: "DELETE" });
}
