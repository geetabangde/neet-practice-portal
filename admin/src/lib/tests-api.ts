import { apiRequest, type ApiResult } from "@/lib/api";
import type { MockTest } from "@/types";

// What the backend sends: the same test, but with numeric ids
interface ApiTest extends Omit<MockTest, "id" | "subjectIds" | "topicIds" | "questionIds"> {
  id: number;
  subjectIds: number[];
  topicIds: number[];
  questionIds: number[];
}

// The admin panel keeps ids as strings everywhere, so convert once, here
function toTest(test: ApiTest): MockTest {
  return {
    ...test,
    id: String(test.id),
    subjectIds: test.subjectIds.map(String),
    topicIds: test.topicIds.map(String),
    questionIds: test.questionIds.map(String),
  };
}

// What the wizard sends
export type TestFields = Omit<MockTest, "id">;

async function mapTest(request: Promise<ApiResult<{ test: ApiTest }>>): Promise<ApiResult<MockTest>> {
  const result = await request;
  return result.ok ? { ok: true, data: toTest(result.data.test) } : result;
}

export async function fetchTests(): Promise<ApiResult<MockTest[]>> {
  const result = await apiRequest<{ tests: ApiTest[] }>("/api/admin/tests");
  return result.ok ? { ok: true, data: result.data.tests.map(toTest) } : result;
}

export function createTest(fields: TestFields): Promise<ApiResult<MockTest>> {
  return mapTest(apiRequest("/api/admin/tests", { method: "POST", body: fields }));
}

export function updateTest(id: string, fields: Partial<TestFields>): Promise<ApiResult<MockTest>> {
  return mapTest(apiRequest(`/api/admin/tests/${id}`, { method: "PATCH", body: fields }));
}

export function deleteTest(id: string): Promise<ApiResult<null>> {
  return apiRequest<null>(`/api/admin/tests/${id}`, { method: "DELETE" });
}
