import { Router } from "express";
import { importQuestionsHandler } from "../controllers/question-import.controller";
import {
  createQuestionHandler,
  deleteQuestionHandler,
  getQuestionHandler,
  listQuestionsHandler,
  updateQuestionHandler,
} from "../controllers/question.controller";

// Mounted at /api/admin/questions, behind requireAdmin (see admin.routes.ts)
export const questionRouter = Router();

questionRouter.get("/", listQuestionsHandler);
// Bulk import from a spreadsheet (see question-import.service.ts)
questionRouter.post("/import", importQuestionsHandler);
questionRouter.post("/", createQuestionHandler);
questionRouter.get("/:id", getQuestionHandler);
questionRouter.patch("/:id", updateQuestionHandler);
questionRouter.delete("/:id", deleteQuestionHandler);
