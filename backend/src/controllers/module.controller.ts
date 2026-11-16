import type { Request, Response } from "express";
import {
  createModule,
  deleteModule,
  getModule,
  isDuplicateModule,
  isMissingSubjectForModule,
  listModules,
  updateModule,
  type ModuleStatus,
} from "../services/module.service";

// "12" or 12 -> 12; anything else -> null
function toId(raw: unknown): number | null {
  const id = typeof raw === "string" && /^\d+$/.test(raw) ? Number(raw) : typeof raw === "number" ? raw : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

type Checked<T> = { ok: true; value: T } | { ok: false; message: string };

function readName(data: Record<string, unknown>): Checked<string> {
  if (typeof data.name !== "string" || data.name.trim() === "") return { ok: false, message: "Enter the module name" };
  if (data.name.trim().length > 150) return { ok: false, message: "Module name must be 150 characters or fewer" };
  return { ok: true, value: data.name.trim() };
}

function readStatus(data: Record<string, unknown>): Checked<ModuleStatus | undefined> {
  if (data.status === undefined) return { ok: true, value: undefined };
  if (data.status !== "active" && data.status !== "inactive") return { ok: false, message: "Status must be active or inactive" };
  return { ok: true, value: data.status };
}

function bodyOf(req: Request): Record<string, unknown> | null {
  return typeof req.body === "object" && req.body !== null ? (req.body as Record<string, unknown>) : null;
}

const NOT_FOUND = { success: false, message: "Module not found" };
const DUPLICATE = { success: false, message: "This subject already has a module with this name" };
const FAILED = { success: false, message: "Something went wrong" };

// GET /api/admin/modules  or  /api/admin/modules?subjectId=3
export async function listModulesHandler(req: Request, res: Response): Promise<void> {
  const raw = req.query.subjectId;
  const subjectId = raw === undefined ? undefined : toId(raw);
  if (subjectId === null) {
    res.status(400).json({ success: false, message: "subjectId must be a number" });
    return;
  }
  try {
    res.json({ success: true, message: "Modules", data: { modules: await listModules(subjectId) } });
  } catch (error) {
    console.error("List modules failed:", error);
    res.status(500).json(FAILED);
  }
}

export async function getModuleHandler(req: Request, res: Response): Promise<void> {
  const id = toId(req.params.id);
  if (id === null) {
    res.status(404).json(NOT_FOUND);
    return;
  }
  try {
    const found = await getModule(id);
    if (!found) res.status(404).json(NOT_FOUND);
    else res.json({ success: true, message: "Module", data: { module: found } });
  } catch (error) {
    console.error("Get module failed:", error);
    res.status(500).json(FAILED);
  }
}

export async function createModuleHandler(req: Request, res: Response): Promise<void> {
  const data = bodyOf(req);
  if (!data) {
    res.status(400).json({ success: false, message: "Send the module details as JSON" });
    return;
  }
  const subjectId = toId(data.subjectId);
  const name = readName(data);
  const status = readStatus(data);
  if (subjectId === null) {
    res.status(400).json({ success: false, message: "Choose the subject of this module" });
    return;
  }
  if (!name.ok || !status.ok) {
    res.status(400).json({ success: false, message: !name.ok ? name.message : (status as { message: string }).message });
    return;
  }
  try {
    const created = await createModule({ subjectId, name: name.value, status: status.value ?? "active" });
    res.status(201).json({ success: true, message: "Module created", data: { module: created } });
  } catch (error) {
    if (isDuplicateModule(error)) res.status(409).json(DUPLICATE);
    else if (isMissingSubjectForModule(error)) res.status(400).json({ success: false, message: "The chosen subject does not exist" });
    else {
      console.error("Create module failed:", error);
      res.status(500).json(FAILED);
    }
  }
}

// PATCH: send the fields that change (name, status). The subject of a module can not be changed.
export async function updateModuleHandler(req: Request, res: Response): Promise<void> {
  const id = toId(req.params.id);
  if (id === null) {
    res.status(404).json(NOT_FOUND);
    return;
  }
  const data = bodyOf(req);
  if (!data) {
    res.status(400).json({ success: false, message: "Send the module details as JSON" });
    return;
  }
  const patch: { name?: string; status?: ModuleStatus } = {};
  if (data.name !== undefined) {
    const name = readName(data);
    if (!name.ok) {
      res.status(400).json({ success: false, message: name.message });
      return;
    }
    patch.name = name.value;
  }
  const status = readStatus(data);
  if (!status.ok) {
    res.status(400).json({ success: false, message: status.message });
    return;
  }
  if (status.value) patch.status = status.value;

  try {
    const updated = await updateModule(id, patch);
    if (!updated) res.status(404).json(NOT_FOUND);
    else res.json({ success: true, message: "Module updated", data: { module: updated } });
  } catch (error) {
    if (isDuplicateModule(error)) res.status(409).json(DUPLICATE);
    else {
      console.error("Update module failed:", error);
      res.status(500).json(FAILED);
    }
  }
}

export async function deleteModuleHandler(req: Request, res: Response): Promise<void> {
  const id = toId(req.params.id);
  if (id === null) {
    res.status(404).json(NOT_FOUND);
    return;
  }
  try {
    const removed = await deleteModule(id);
    if (!removed) res.status(404).json(NOT_FOUND);
    else res.json({ success: true, message: "Module deleted" });
  } catch (error) {
    console.error("Delete module failed:", error);
    res.status(500).json(FAILED);
  }
}
