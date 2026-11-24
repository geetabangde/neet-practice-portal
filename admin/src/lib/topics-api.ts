import { apiRequest, type ApiResult } from "@/lib/api";
import type { Topic } from "@/types";

// What the backend sends: the same topic, but with numeric ids
interface ApiTopic extends Omit<Topic, "id" | "subjectId" | "moduleId"> {
  id: number;
  subjectId: number;
  moduleId: number;
}

// The admin panel keeps ids as strings everywhere, so convert once, here
function toTopic(topic: ApiTopic): Topic {
  return { ...topic, id: String(topic.id), subjectId: String(topic.subjectId), moduleId: String(topic.moduleId) };
}

// A topic is made inside a module; the server works out the subject from it
type TopicFields = Pick<Topic, "moduleId" | "name" | "durationMinutes" | "status">;

async function mapTopic(request: Promise<ApiResult<{ topic: ApiTopic }>>): Promise<ApiResult<Topic>> {
  const result = await request;
  return result.ok ? { ok: true, data: toTopic(result.data.topic) } : result;
}

export async function fetchTopics(): Promise<ApiResult<Topic[]>> {
  const result = await apiRequest<{ topics: ApiTopic[] }>("/api/admin/topics");
  return result.ok ? { ok: true, data: result.data.topics.map(toTopic) } : result;
}

export function createTopic(fields: TopicFields): Promise<ApiResult<Topic>> {
  return mapTopic(apiRequest("/api/admin/topics", { method: "POST", body: fields }));
}

// moduleId may change, to move the topic to another module of the same subject
export function updateTopic(id: string, fields: Partial<TopicFields>): Promise<ApiResult<Topic>> {
  return mapTopic(apiRequest(`/api/admin/topics/${id}`, { method: "PATCH", body: fields }));
}

export function deleteTopic(id: string): Promise<ApiResult<null>> {
  return apiRequest<null>(`/api/admin/topics/${id}`, { method: "DELETE" });
}
