import { Router } from "express";
import {
  createTestHandler,
  deleteTestHandler,
  getTestHandler,
  listTestsHandler,
  updateTestHandler,
} from "../controllers/test.controller";

// Mounted at /api/admin/tests, behind requireAdmin (see admin.routes.ts)
export const testRouter = Router();

testRouter.get("/", listTestsHandler);
testRouter.post("/", createTestHandler);
testRouter.get("/:id", getTestHandler);
testRouter.patch("/:id", updateTestHandler);
testRouter.delete("/:id", deleteTestHandler);
