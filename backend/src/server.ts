// Loads backend/.env into process.env. It must come before the app is created.
import "dotenv/config";
import { createApp } from "./app";

const port = Number(process.env.PORT) || 5000;

createApp().listen(port, () => {
  console.log(`NEET PG backend listening on http://localhost:${port}`);
});
