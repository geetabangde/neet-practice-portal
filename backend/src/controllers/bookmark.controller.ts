import type { Request, Response } from "express";
import { addBookmark, listBookmarkGroups, listBookmarkedQuestions, removeBookmark } from "../services/bookmark.service";

const FAILED = { success: false, message: "Something went wrong" };

// "12" -> 12; anything else -> null
function toId(raw: unknown): number | null {
  const id = typeof raw === "string" && /^\d+$/.test(raw) ? Number(raw) : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

const studentIdOf = (res: Response) => (res.locals.student as { id: number }).id;

// GET /api/student/bookmarks  ->  the bookmarks, grouped by module
export async function listBookmarksHandler(_req: Request, res: Response): Promise<void> {
  try {
    res.json({ success: true, message: "Bookmarks", data: { bookmarks: await listBookmarkGroups(studentIdOf(res)) } });
  } catch (error) {
    console.error("List bookmarks failed:", error);
    res.status(500).json(FAILED);
  }
}

// GET /api/student/bookmarks/modules/:moduleId  ->  the bookmarked questions of one module (without answers)
export async function bookmarkedQuestionsHandler(req: Request, res: Response): Promise<void> {
  const moduleId = toId(req.params.moduleId);
  try {
    const found = moduleId === null ? null : await listBookmarkedQuestions(studentIdOf(res), moduleId);
    if (!found) {
      res.status(404).json({ success: false, message: "No bookmarks found here" });
      return;
    }
    res.json({ success: true, message: "Bookmarked questions", data: found });
  } catch (error) {
    console.error("Bookmarked questions failed:", error);
    res.status(500).json(FAILED);
  }
}

// PUT /api/student/bookmarks/:questionId  ->  bookmark a question (doing it again changes nothing)
export async function addBookmarkHandler(req: Request, res: Response): Promise<void> {
  const questionId = toId(req.params.questionId);
  try {
    const added = questionId === null ? false : await addBookmark(studentIdOf(res), questionId);
    if (!added) {
      res.status(404).json({ success: false, message: "Question not found" });
      return;
    }
    res.json({ success: true, message: "Bookmarked" });
  } catch (error) {
    console.error("Add bookmark failed:", error);
    res.status(500).json(FAILED);
  }
}

// DELETE /api/student/bookmarks/:questionId  ->  remove the bookmark (also fine if it was not there)
export async function removeBookmarkHandler(req: Request, res: Response): Promise<void> {
  const questionId = toId(req.params.questionId);
  if (questionId === null) {
    res.status(404).json({ success: false, message: "Question not found" });
    return;
  }
  try {
    await removeBookmark(studentIdOf(res), questionId);
    res.json({ success: true, message: "Bookmark removed" });
  } catch (error) {
    console.error("Remove bookmark failed:", error);
    res.status(500).json(FAILED);
  }
}
