import type { RowDataPacket } from "mysql2/promise";
import { pool } from "../config/db";

// Grand tests are open to everyone. These kinds of test need a paid plan.
const PAID_KINDS = ["mini", "subject"] as const;

export function needsPaidPlan(kind: string): boolean {
  return (PAID_KINDS as readonly string[]).includes(kind);
}

// True when the student has a plan that is not free (price above 0) and has not run out.
// A plan with no expiry date never runs out. The admin gives a student a plan in the Students screen.
export async function hasPaidPlan(studentId: number): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 1 FROM students s JOIN plans p ON p.id = s.plan_id
      WHERE s.id = ? AND p.price > 0 AND (s.plan_expires_at IS NULL OR s.plan_expires_at > NOW()) LIMIT 1`,
    [studentId],
  );
  return rows.length > 0;
}

export const PAID_PLAN_MESSAGE = "This test needs a paid plan. Choose a plan to unlock it.";

// One row for each plan a student bought. The Analytics screen counts revenue from here.
export const CREATE_PURCHASE_TABLES = [
  `CREATE TABLE IF NOT EXISTS plan_purchases (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    student_id INT UNSIGNED NOT NULL,
    plan_id    INT UNSIGNED NULL,
    months     SMALLINT UNSIGNED NOT NULL,
    -- Whole rupees paid
    amount     INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_plan_purchases_created (created_at),
    KEY idx_plan_purchases_student (student_id),
    CONSTRAINT fk_plan_purchases_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
    CONSTRAINT fk_plan_purchases_plan FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

export interface CurrentPlan {
  name: string;
  price: number;
  // YYYY-MM-DD, or null when the plan never runs out
  expiresAt: string | null;
  // false once the expiry date has passed
  active: boolean;
}

// The plan a student has now, or null when there is none
export async function getStudentPlan(studentId: number): Promise<CurrentPlan | null> {
  const [rows] = await pool.query<(RowDataPacket & { name: string; price: number; expiresAt: string | null; valid: number })[]>(
    `SELECT p.name, p.price, DATE_FORMAT(s.plan_expires_at, '%Y-%m-%d') AS expiresAt,
            (s.plan_expires_at IS NULL OR s.plan_expires_at > NOW()) AS valid
       FROM students s JOIN plans p ON p.id = s.plan_id WHERE s.id = ? LIMIT 1`,
    [studentId],
  );
  const row = rows[0];
  return row ? { name: row.name, price: row.price, expiresAt: row.expiresAt, active: row.valid === 1 } : null;
}

// Online payment is not connected yet. In demo mode no money is taken and the plan is activated straight away,
// so the whole flow can be tried. Without PAYMENT_MODE=demo the purchase is refused.
export function isDemoPayment(): boolean {
  return process.env.PAYMENT_MODE === "demo";
}

export type PurchaseOutcome = { ok: true; plan: CurrentPlan } | { ok: false; status: number; message: string };

// Gives the student the plan for `months` months. Buying the plan the student already has adds the months
// to the end of the current period. Any other plan starts today.
// "amount" is what the student paid, in whole rupees. Payment is in demo mode, so the screen sends the price it showed;
// when a real gateway is connected the amount must come from the gateway, not from the browser.
export async function activatePlan(studentId: number, planName: string, months: number, amount?: number): Promise<PurchaseOutcome> {
  const [plans] = await pool.query<(RowDataPacket & { id: number; price: number })[]>(
    "SELECT id, price FROM plans WHERE name = ? AND status = 'active' AND price > 0 LIMIT 1",
    [planName],
  );
  const plan = plans[0];
  if (!plan) return { ok: false, status: 404, message: "This plan is not available." };

  // plan_expires_at is set before plan_id on purpose: MySQL reads plan_id as it was before this update
  await pool.query(
    `UPDATE students
        SET plan_expires_at = DATE_ADD(IF(plan_id = ? AND plan_expires_at > NOW(), plan_expires_at, NOW()), INTERVAL ? MONTH),
            plan_id = ?
      WHERE id = ?`,
    [plan.id, months, plan.id, studentId],
  );
  const paid = amount !== undefined && Number.isInteger(amount) && amount >= 0 && amount <= 10_000_000 ? amount : plan.price;
  await pool.query("INSERT INTO plan_purchases (student_id, plan_id, months, amount) VALUES (?, ?, ?, ?)", [studentId, plan.id, months, paid]);
  const current = await getStudentPlan(studentId);
  if (!current) return { ok: false, status: 500, message: "Something went wrong" };
  return { ok: true, plan: current };
}
