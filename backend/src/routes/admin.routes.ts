import { Router } from "express";
import { getAdminProfile } from "../controllers/auth.controller";
import { moduleRouter } from "./module.routes";
import { studentAdminRouter } from "./student-admin.routes";
import { subjectRouter } from "./subject.routes";
import { planRouter } from "./plan.routes";
import { questionRouter } from "./question.routes";
import { testRouter } from "./test.routes";
import { topicRouter } from "./topic.routes";
import { requireAdmin } from "../middleware/auth.middleware";

export const adminRouter = Router();

// Every route in this file needs a valid admin token
adminRouter.use(requireAdmin);
adminRouter.get("/profile", getAdminProfile);
adminRouter.use("/subjects", subjectRouter);
adminRouter.use("/modules", moduleRouter);
adminRouter.use("/topics", topicRouter);
adminRouter.use("/questions", questionRouter);
adminRouter.use("/tests", testRouter);
adminRouter.use("/plans", planRouter);
adminRouter.use("/students", studentAdminRouter);
