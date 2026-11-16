import type { Request, Response } from "express";
import {
  TopicModuleError,
  createTopic,
  deleteTopic,
  getTopic,
  isDuplicateTopic,
  listTopics,
  updateTopic,
  type TopicInput,
  type TopicStatus,
} from "../services/topic.service";

type Validation = { ok: true; value: Partial<TopicInput> } | { ok: false; message: string };

// "12" or 12 -> 12; anything else -> null
function toId(raw: unknown): number | null {
  const id = typeof raw === "string" && /^\d+$/.test(raw) ? Number(raw) : typeof raw === "number" ? raw : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// With partial = false the module is required (create); with partial = true only the fields that
// were sent are checked (update).
function validate(body: unknown, partial: boolean): Validation {
  if (typeof body !== "object" || body === null) return { ok: false, message: "Send the topic details as JSON" };
  const data = body as Record<string, unknown>;
  const value: Partial<TopicInput> = {};

  if (data.moduleId !== undefined || !partial) {
    const moduleId = toId(data.moduleId);
    if (moduleId === null) return { ok: false, message: "Choose the module this topic belongs to" };
    value.moduleId = moduleId;
  }
  if (data.name !== undefined || !partial) {
    if (typeof data.name !== "string" || data.name.trim() === "") return { ok: false, message: "Enter the topic name" };
    if (data.name.trim().length > 150) return { ok: false, message: "Topic name must be 150 characters or fewer" };
    value.name = data.name.trim();
  }
  if (data.status !== undefined) {
    if (data.status !== "active" && data.status !== "inactive") return { ok: false, message: "Status must be active or inactive" };
    value.status = data.status as TopicStatus;
  } else if (!partial) {
    value.status = "active";
  }
  return { ok: true, value };
}

const NOT_FOUND = { success: false, message: "Topic not found" };
const DUPLICATE = { success: false, message: "This module already has a topic with this name" };
const FAILED = { success: false, message: "Something went wrong" };

// Answers a failed save when the problem was the chosen module. Returns true when it did.
function moduleProblem(error: unknown, res: Response): boolean {
  if (!(error instanceof TopicModuleError)) return false;
  const message =
    error.reason === "missing" ? "The chosen module does not exist" : "A topic can only be moved to a module of the same subject";
  res.status(400).json({ success: false, message });
  return true;
}

// GET /api/admin/topics                  -> all topics
// GET /api/admin/topics?subjectId=3      -> topics of one subject
// GET /api/admin/topics?moduleId=5       -> topics of one module
export async function listTopicsHandler(req: Request, res: Response): Promise<void> {
  const filter: { subjectId?: number; moduleId?: number } = {};
  for (const key of ["subjectId", "moduleId"] as const) {
    const raw = req.query[key];
    if (raw === undefined) continue;
    const id = toId(raw);
    if (id === null) {
      res.status(400).json({ success: false, message: `${key} must be a number` });
      return;
    }
    filter[key] = id;
  }
  try {
    res.json({ success: true, message: "Topics", data: { topics: await listTopics(filter) } });
  } catch (error) {
    console.error("List topics failed:", error);
    res.status(500).json(FAILED);
  }
}

export async function getTopicHandler(req: Request, res: Response): Promise<void> {
  const id = toId(req.params.id);
  if (id === null) {
    res.status(404).json(NOT_FOUND);
    return;
  }
  try {
    const topic = await getTopic(id);
    if (!topic) res.status(404).json(NOT_FOUND);
    else res.json({ success: true, message: "Topic", data: { topic } });
  } catch (error) {
    console.error("Get topic failed:", error);
    res.status(500).json(FAILED);
  }
}

export async function createTopicHandler(req: Request, res: Response): Promise<void> {
  const checked = validate(req.body, false);
  if (!checked.ok) {
    res.status(400).json({ success: false, message: checked.message });
    return;
  }
  try {
    const topic = await createTopic(checked.value as TopicInput);
    res.status(201).json({ success: true, message: "Topic created", data: { topic } });
  } catch (error) {
    if (moduleProblem(error, res)) return;
    if (isDuplicateTopic(error)) res.status(409).json(DUPLICATE);
    else {
      console.error("Create topic failed:", error);
      res.status(500).json(FAILED);
    }
  }
}

export async function updateTopicHandler(req: Request, res: Response): Promise<void> {
  const id = toId(req.params.id);
  if (id === null) {
    res.status(404).json(NOT_FOUND);
    return;
  }
  const checked = validate(req.body, true);
  if (!checked.ok) {
    res.status(400).json({ success: false, message: checked.message });
    return;
  }
  try {
    const topic = await updateTopic(id, checked.value);
    if (!topic) res.status(404).json(NOT_FOUND);
    else res.json({ success: true, message: "Topic updated", data: { topic } });
  } catch (error) {
    if (moduleProblem(error, res)) return;
    if (isDuplicateTopic(error)) res.status(409).json(DUPLICATE);
    else {
      console.error("Update topic failed:", error);
      res.status(500).json(FAILED);
    }
  }
}

export async function deleteTopicHandler(req: Request, res: Response): Promise<void> {
  const id = toId(req.params.id);
  if (id === null) {
    res.status(404).json(NOT_FOUND);
    return;
  }
  try {
    const removed = await deleteTopic(id);
    if (!removed) res.status(404).json(NOT_FOUND);
    else res.json({ success: true, message: "Topic deleted" });
  } catch (error) {
    console.error("Delete topic failed:", error);
    res.status(500).json(FAILED);
  }
}
