import { Router } from "express";
import { checkDatabase } from "../config/db";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({ success: true, message: "NEET PG backend is running" });
});

healthRouter.get("/db", async (_req, res) => {
  try {
    await checkDatabase();
    res.json({ success: true, message: "MySQL database connected successfully" });
  } catch (error) {
    // The full error stays in the server log; the client only gets a safe message
    console.error("Database health check failed:", error);
    res.status(503).json({ success: false, message: "Database connection failed" });
  }
});
