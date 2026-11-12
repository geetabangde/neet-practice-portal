// Creates the "plans" tables and adds the five starter plans. Run with: npm run seed:plans
// Safe to run again: a plan whose name already exists is skipped. Edit the prices in the admin panel afterwards.
import "dotenv/config";
import { pool } from "../config/db";
import { CREATE_PLAN_TABLES, createPlan, isDuplicatePlan, type PlanInput } from "../services/plan.service";

const STARTER_PLANS: PlanInput[] = [
  {
    name: "Free Trial",
    price: 0,
    durationMonths: 1,
    status: "active",
    features: ["Sample modules in every subject", "Answers with explanations", "Limited custom modules"],
  },
  {
    name: "Plan A",
    price: 9999,
    durationMonths: 9,
    status: "active",
    features: ["Full Test Series", "Grand Tests with rank", "Score and rank report", "Performance analytics"],
  },
  {
    name: "Plan B",
    price: 14999,
    durationMonths: 12,
    status: "active",
    features: ["QBank with 18,500+ MCQs", "Full Test Series", "Custom Module", "Bookmarks and Magic Module"],
  },
  {
    name: "Plan C",
    price: 28999,
    durationMonths: 12,
    status: "active",
    features: [
      "810+ hours of video classes",
      "QBank with 18,500+ MCQs",
      "Test Series with 390+ tests",
      "Updated Schema",
      "Priority doubt support",
    ],
  },
  {
    name: "Legacy Plan",
    price: 7999,
    durationMonths: 6,
    status: "inactive",
    features: ["QBank access", "Basic Test Series"],
  },
];

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
