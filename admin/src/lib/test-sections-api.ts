import { apiRequest, type ApiResult } from "@/lib/api";

// A test can be cut into parts (Part A, Part B ...), each with its own timer. A student in Part A cannot go to Part B until
// the time of Part A runs out. A test with no parts has one timer for the whole test.
export interface TestSection {
  id: string;
  // 1, 2, 3 ... the order of the parts
  position: number;
  name: string;
  durationMinutes: number;
  instructions: string;
  questionCount: number;
}

// What the admin writes for a part. An empty name makes it "Part A", "Part B" ... by its place.
export interface SectionFields {
  name: string;
  durationMinutes: number;
  instructions: string;
}

interface ApiSection extends Omit<TestSection, "id"> {
  id: number;
}

// Every call answers with the parts and the duration of the test (the total of the parts)
export interface SectionsReply {
  sections: TestSection[];
  durationMinutes: number;
}

async function replyFrom(request: Promise<ApiResult<{ sections: ApiSection[]; durationMinutes: number }>>): Promise<ApiResult<SectionsReply>> {
  const result = await request;
  if (!result.ok) return result;
  return { ok: true, data: { sections: result.data.sections.map((section) => ({ ...section, id: String(section.id) })), durationMinutes: result.data.durationMinutes } };
}

export function fetchTestSections(testId: string): Promise<ApiResult<SectionsReply>> {
  return replyFrom(apiRequest(`/api/admin/tests/${testId}/sections`));
}

export function addTestSection(testId: string, fields: SectionFields): Promise<ApiResult<SectionsReply>> {
  return replyFrom(apiRequest(`/api/admin/tests/${testId}/sections`, { method: "POST", body: fields }));
}

export function updateTestSection(testId: string, sectionId: string, fields: SectionFields): Promise<ApiResult<SectionsReply>> {
  return replyFrom(apiRequest(`/api/admin/tests/${testId}/sections/${sectionId}`, { method: "PATCH", body: fields }));
}

// The questions of the deleted part move to the part before it (or the one after it, for the first part)
export function deleteTestSection(testId: string, sectionId: string): Promise<ApiResult<SectionsReply>> {
  return replyFrom(apiRequest(`/api/admin/tests/${testId}/sections/${sectionId}`, { method: "DELETE" }));
}

// "ids" holds every part of the test, in the new order
export function reorderTestSections(testId: string, ids: string[]): Promise<ApiResult<SectionsReply>> {
  return replyFrom(apiRequest(`/api/admin/tests/${testId}/sections-order`, { method: "PUT", body: { ids: ids.map(Number) } }));
}
