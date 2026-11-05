import cors from "cors";
import express, { type ErrorRequestHandler, type Express } from "express";
import { adminRouter } from "./routes/admin.routes";
import { authRouter } from "./routes/auth.routes";
import { healthRouter } from "./routes/health.routes";

// Builds the Express app. server.ts starts it; keeping the two apart makes the app easy to test later.
export function createApp(): Express {
  const app = express();

  // Only the student site and the admin panel may call this API from a browser
  const allowedOrigins = [process.env.FRONTEND_ORIGIN ?? "http://localhost:3000", process.env.ADMIN_ORIGIN ?? "http://localhost:3001"];
  app.use(cors({ origin: allowedOrigins }));
  app.use(express.json());

  // GET /api/health and GET /api/health/db
  app.use("/api/health", healthRouter);

  // POST /api/auth/admin/login
  app.use("/api/auth", authRouter);
  // GET /api/admin/profile (admin token required)
  app.use("/api/admin", adminRouter);

  // Any other URL
  app.use((_req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
  });

  // Express recognises an error handler by its four parameters
  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  };
  app.use(errorHandler);

  return app;
}
