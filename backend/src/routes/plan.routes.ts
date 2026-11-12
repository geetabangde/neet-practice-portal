import { Router } from "express";
import {
  createPlanHandler,
  deletePlanHandler,
  getPlanHandler,
  listPlansHandler,
  updatePlanHandler,
} from "../controllers/plan.controller";

// Mounted at /api/admin/plans, behind requireAdmin (see admin.routes.ts)
export const planRouter = Router();

planRouter.get("/", listPlansHandler);
planRouter.post("/", createPlanHandler);
planRouter.get("/:id", getPlanHandler);
planRouter.patch("/:id", updatePlanHandler);
planRouter.delete("/:id", deletePlanHandler);
