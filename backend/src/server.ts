// Loads backend/.env into process.env. It must come before the app is created.
import "dotenv/config";
import { createApp } from "./app";
import { assertAuthConfig } from "./services/auth.service";

// Stop at startup, not at the first login, when JWT_SECRET is missing or weak
assertAuthConfig();

const port = Number(process.env.PORT) || 5000;

createApp().listen(port, () => {
  console.log(`NEET PG backend listening on http://localhost:${port}`);
});
