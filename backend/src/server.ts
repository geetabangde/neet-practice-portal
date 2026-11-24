// Loads backend/.env into process.env. It must come before the app is created.
import "dotenv/config";
import { createApp } from "./app";
import { assertAuthConfig } from "./services/auth.service";
import { logOtpMode } from "./services/sms.service";
import { ensureDbReady } from "./services/db-init.service";

// Stop at startup, not at the first login, when JWT_SECRET is missing or weak
assertAuthConfig();
logOtpMode();

const port = Number(process.env.PORT) || 5000;

async function start() {
  try {
    await ensureDbReady();
    console.log("Database schema initialized and ready.");
  } catch (error) {
    console.error("Database initialization notice:", error instanceof Error ? error.message : error);
  }

  createApp().listen(port, () => {
    console.log(`NEET PG backend listening on http://localhost:${port}`);
  });
}

void start();
