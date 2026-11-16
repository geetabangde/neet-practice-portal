// Creates the "plans" tables and adds the five starter plans. Run with: npm run seed:plans
// Safe to run again: a plan whose name already exists is skipped. Edit the prices in the admin panel afterwards.
import "dotenv/config";
import { pool } from "../config/db";
import { CREATE_PLAN_TABLES, createPlan, isDuplicatePlan } from "../services/plan.service";
import { STARTER_PLANS } from "./starter-data";

async function main(): Promise<void> {
  for (const statement of CREATE_PLAN_TABLES) await pool.query(statement);
  let added = 0;
  for (const plan of STARTER_PLANS) {
    try {
      await createPlan(plan);
      added += 1;
    } catch (error) {
      if (!isDuplicatePlan(error)) throw error;
    }
  }
  console.log(`plans tables ready. ${added} starter plan(s) added.`);
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
