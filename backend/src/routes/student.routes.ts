import { Router } from "express";
import { getStudentProfile } from "../controllers/student-auth.controller";
import { addBookmarkHandler, bookmarkedQuestionsHandler, listBookmarksHandler, removeBookmarkHandler } from "../controllers/bookmark.controller";
import { createCustomModuleHandler, customModuleOptionsHandler, getCustomModuleHandler } from "../controllers/custom-module.controller";
import { getSubjectHandler, listSubjectsHandler } from "../controllers/student-content.controller";
import { answerQuestionHandler, getTopicQuestionsHandler } from "../controllers/student-practice.controller";
import { getAttemptHandler, saveAnswerHandler, startAttemptHandler, submitAttemptHandler } from "../controllers/test-attempt.controller";
import { listStudentTestsHandler } from "../controllers/student-test.controller";
import { requireStudent } from "../middleware/auth.middleware";

// Mounted at /api/student. Every route here needs a student token (an admin token is refused).
export const studentRouter = Router();

studentRouter.use(requireStudent);
studentRouter.get("/me", getStudentProfile);
studentRouter.get("/subjects", listSubjectsHandler);
studentRouter.get("/subjects/:slug", getSubjectHandler);
// Practice: the questions of a topic, and answering one
studentRouter.get("/topics/:id/questions", getTopicQuestionsHandler);
studentRouter.post("/questions/:id/answer", answerQuestionHandler);
// Custom module: choices, making one, and solving it
studentRouter.get("/custom-module/options", customModuleOptionsHandler);
studentRouter.post("/custom-modules", createCustomModuleHandler);
studentRouter.get("/custom-modules/:id", getCustomModuleHandler);
// Test Series
studentRouter.get("/tests", listStudentTestsHandler);
studentRouter.post("/tests/:id/attempt", startAttemptHandler);
studentRouter.get("/attempts/:id", getAttemptHandler);
studentRouter.put("/attempts/:id/answers/:questionId", saveAnswerHandler);
studentRouter.post("/attempts/:id/submit", submitAttemptHandler);
// Bookmarks
studentRouter.get("/bookmarks", listBookmarksHandler);
studentRouter.get("/bookmarks/modules/:moduleId", bookmarkedQuestionsHandler);
studentRouter.put("/bookmarks/:questionId", addBookmarkHandler);
studentRouter.delete("/bookmarks/:questionId", removeBookmarkHandler);
