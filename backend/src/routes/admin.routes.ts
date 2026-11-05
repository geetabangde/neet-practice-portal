import { Router } from "express";
import { getAdminProfile } from "../controllers/auth.controller";
import { requireAdmin } from "../middleware/auth.middleware";

export const adminRouter = Router();

// Every route in this file needs a valid admin token
adminRouter.use(requireAdmin);
adminRouter.get("/profile", getAdminProfile);
