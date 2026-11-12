import { Router } from "express";
import {
  createTopicHandler,
  deleteTopicHandler,
  getTopicHandler,
  listTopicsHandler,
  updateTopicHandler,
} from "../controllers/topic.controller";

// Mounted at /api/admin/topics, behind requireAdmin (see admin.routes.ts)
export const topicRouter = Router();

topicRouter.get("/", listTopicsHandler);
topicRouter.post("/", createTopicHandler);
topicRouter.get("/:id", getTopicHandler);
topicRouter.patch("/:id", updateTopicHandler);
topicRouter.delete("/:id", deleteTopicHandler);
