import { Router } from "express";
import {
  createModuleHandler,
  deleteModuleHandler,
  getModuleHandler,
  listModulesHandler,
  updateModuleHandler,
} from "../controllers/module.controller";

// Mounted at /api/admin/modules, behind requireAdmin (see admin.routes.ts)
export const moduleRouter = Router();

moduleRouter.get("/", listModulesHandler);
moduleRouter.post("/", createModuleHandler);
moduleRouter.get("/:id", getModuleHandler);
moduleRouter.patch("/:id", updateModuleHandler);
moduleRouter.delete("/:id", deleteModuleHandler);
