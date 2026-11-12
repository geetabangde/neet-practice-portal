import type { Request, Response } from "express";
import {
  createTopic,
  deleteTopic,
  getTopic,
  isDuplicateTopic,
  isMissingSubject,
  listTopics,
  updateTopic,
  type TopicInput,
  type TopicStatus,
} from "../services/topic.service";

type Validation = { ok: true; value: Partial<TopicInput> } | { ok: false; message: string };

// "12" -> 12; anything else -> null
function toId(raw: unknown): number | null {
  const id = typeof raw === "string" && /^\d+$/.test(raw) ? Number(raw) : typeof raw === "number" ? raw : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// With partial = false every field that has no default is required (create);
// with partial = true only the fields that were sent are checked (update).
function validate(body: unknown, partial: boolean): Validation {
  if (typeof body !== "object" || body === null) return { ok: false, message: "Send the topic details as JSON" };
  const data = body as Record<string, unknown>;
  const value: Partial<TopicInput> = {};

  if (data.subjectId !== undefined || !partial) {
    const subjectId = toId(data.subjectId);
    if (subjectId === null) return { ok: false, message: "Choose the subject this topic belongs to" };
    value.subjectId = subjectId;
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
const DUPLICATE = { success: false, message: "This subject already has a topic with this name" };
const NO_SUBJECT = { success: false, message: "The chosen subject does not exist" };
const FAILED = { success: false, message: "Something went wrong" };

// GET /api/admin/topics            -> all topics
// GET /api/admin/topics?subjectId=3 -> topics of one subject
export async function listTopicsHandler(req: Request, res: Response): Promise<void> {
  const rawSubject = req.query.subjectId;
  const subjectId = rawSubject === undefined ? undefined : toId(rawSubject);
  if (subjectId === null) {
    res.status(400).json({ success: false, message: "subjectId must be a number" });
    return;
  }
  try {
    res.json({ success: true, message: "Topics", data: { topics: await listTopics(subjectId) } });
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
    if (isDuplicateTopic(error)) res.status(409).json(DUPLICATE);
    else if (isMissingSubject(error)) res.status(400).json(NO_SUBJECT);
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
    if (isDuplicateTopic(error)) res.status(409).json(DUPLICATE);
    else if (isMissingSubject(error)) res.status(400).json(NO_SUBJECT);
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
