import { Router } from "express";
import { getStudentHandler, listStudentsHandler, updateStudentHandler } from "../controllers/student-admin.controller";

// Mounted at /api/admin/students, behind requireAdmin (see admin.routes.ts).
// Students sign up by themselves, so there is no "create" or "delete" here.
export const studentAdminRouter = Router();

studentAdminRouter.get("/", listStudentsHandler);
studentAdminRouter.get("/:id", getStudentHandler);
studentAdminRouter.patch("/:id", updateStudentHandler);
