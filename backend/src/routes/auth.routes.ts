import { Router } from "express";
import { adminLogin } from "../controllers/auth.controller";

export const authRouter = Router();

authRouter.post("/admin/login", adminLogin);
