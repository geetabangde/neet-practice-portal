import { Router } from "express";
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
questionRouter.post("/", createQuestionHandler);
questionRouter.get("/:id", getQuestionHandler);
questionRouter.patch("/:id", updateQuestionHandler);
questionRouter.delete("/:id", deleteQuestionHandler);
