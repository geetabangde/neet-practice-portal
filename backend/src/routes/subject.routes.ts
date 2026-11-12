import { Router } from "express";
import {
  createSubjectHandler,
  deleteSubjectHandler,
  getSubjectHandler,
  listSubjectsHandler,
  updateSubjectHandler,
} from "../controllers/subject.controller";

// Mounted at /api/admin/subjects, behind requireAdmin (see admin.routes.ts)
export const subjectRouter = Router();

subjectRouter.get("/", listSubjectsHandler);
subjectRouter.post("/", createSubjectHandler);
subjectRouter.get("/:id", getSubjectHandler);
subjectRouter.patch("/:id", updateSubjectHandler);
subjectRouter.delete("/:id", deleteSubjectHandler);
