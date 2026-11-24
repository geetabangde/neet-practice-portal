import { Router } from "express";
import {
  createTestHandler,
  deleteTestHandler,
  getTestHandler,
  listTestsHandler,
  updateTestHandler,
} from "../controllers/test.controller";
import {
  createSectionHandler,
  deleteSectionHandler,
  listSectionsHandler,
  reorderSectionsHandler,
  updateSectionHandler,
} from "../controllers/test-section.controller";
import {
  addPaperQuestionsHandler,
  deletePaperQuestionHandler,
  listPaperQuestionsHandler,
  reorderPaperQuestionsHandler,
  updatePaperQuestionHandler,
} from "../controllers/test-paper.controller";

// Mounted at /api/admin/tests, behind requireAdmin (see admin.routes.ts)
export const testRouter = Router();

testRouter.get("/", listTestsHandler);
testRouter.post("/", createTestHandler);
testRouter.get("/:id", getTestHandler);
testRouter.patch("/:id", updateTestHandler);
testRouter.delete("/:id", deleteTestHandler);

// The questions written inside a test. They are not QBank questions.
testRouter.get("/:id/questions", listPaperQuestionsHandler);
testRouter.post("/:id/questions", addPaperQuestionsHandler);
testRouter.put("/:id/questions-order", reorderPaperQuestionsHandler);
testRouter.patch("/:id/questions/:questionId", updatePaperQuestionHandler);
testRouter.delete("/:id/questions/:questionId", deletePaperQuestionHandler);

// The parts (Part A, Part B ...) of a test, each with its own timer
testRouter.get("/:id/sections", listSectionsHandler);
testRouter.post("/:id/sections", createSectionHandler);
testRouter.put("/:id/sections-order", reorderSectionsHandler);
testRouter.patch("/:id/sections/:sectionId", updateSectionHandler);
testRouter.delete("/:id/sections/:sectionId", deleteSectionHandler);
