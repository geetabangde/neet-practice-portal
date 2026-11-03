import cors from "cors";
import express, { type ErrorRequestHandler, type Express } from "express";

// Builds the Express app. server.ts starts it; keeping the two apart makes the app easy to test later.
export function createApp(): Express {
  const app = express();

  // Only the student frontend may call this API from a browser
  const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";
  app.use(cors({ origin: frontendOrigin }));
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ success: true, message: "NEET PG backend is running" });
  });

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
