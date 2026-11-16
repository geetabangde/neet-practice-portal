import type { Request, Response } from "express";
import { findStudentSubjectBySlug, listStudentModules, listStudentSubjects } from "../services/student-content.service";

const FAILED = { success: false, message: "Something went wrong" };

// GET /api/student/subjects
export async function listSubjectsHandler(_req: Request, res: Response): Promise<void> {
  const studentId = (res.locals.student as { id: number }).id;
  try {
    res.json({ success: true, message: "Subjects", data: { subjects: await listStudentSubjects(studentId) } });
  } catch (error) {
    console.error("List student subjects failed:", error);
    res.status(500).json(FAILED);
  }
}

// GET /api/student/subjects/:slug  ->  the subject, its active modules, and the active topics of each module
export async function getSubjectHandler(req: Request, res: Response): Promise<void> {
  const slug = typeof req.params.slug === "string" ? req.params.slug.toLowerCase() : "";
  const studentId = (res.locals.student as { id: number }).id;
  try {
    const subject = await findStudentSubjectBySlug(slug, studentId);
    if (!subject) {
      res.status(404).json({ success: false, message: "Subject not found" });
      return;
    }
    res.json({ success: true, message: "Subject", data: { subject, modules: await listStudentModules(subject.id, studentId) } });
  } catch (error) {
    console.error("Get student subject failed:", error);
    res.status(500).json(FAILED);
  }
}
