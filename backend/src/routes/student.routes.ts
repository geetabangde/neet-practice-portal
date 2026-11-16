import { Router } from "express";
import { getStudentProfile } from "../controllers/student-auth.controller";
import { getSubjectHandler, listSubjectsHandler } from "../controllers/student-content.controller";
import { answerQuestionHandler, getTopicQuestionsHandler } from "../controllers/student-practice.controller";
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
