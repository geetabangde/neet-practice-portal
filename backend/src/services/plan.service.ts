import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { pool } from "../config/db";

export type PlanStatus = "active" | "inactive";

export interface Plan {
  id: number;
  name: string;
  // Whole rupees. 0 means a free plan.
  price: number;
  durationMonths: number;
  features: string[];
  status: PlanStatus;
}

export type PlanInput = Omit<Plan, "id">;

interface PlanRow extends RowDataPacket {
  id: number;
  name: string;
  price: number;
  durationMonths: number;
  status: PlanStatus;
}

interface FeatureRow extends RowDataPacket {
  planId: number;
  feature: string;
}

const COLUMNS = "id, name, price, duration_months AS durationMonths, status";

// Features are a list, so they get their own table: one row per feature, kept in order by
// "position". Deleting a plan deletes its features (ON DELETE CASCADE).
export const CREATE_PLAN_TABLES = [
  `CREATE TABLE IF NOT EXISTS plans (
    id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name            VARCHAR(100) NOT NULL,
    price           INT UNSIGNED NOT NULL DEFAULT 0,
    duration_months SMALLINT UNSIGNED NOT NULL,
    status          ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_plans_name (name),
    KEY idx_plans_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS plan_features (
    plan_id  INT UNSIGNED NOT NULL,
    position SMALLINT UNSIGNED NOT NULL,
    feature  VARCHAR(200) NOT NULL,
    PRIMARY KEY (plan_id, position),
    CONSTRAINT fk_plan_features_plan FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

// 1062 = a plan with this name already exists
export function isDuplicatePlan(error: unknown): boolean {
  return typeof error === "object" && error !== null && "errno" in error && error.errno === 1062;
}

async function assemble(rows: PlanRow[]): Promise<Plan[]> {
  if (rows.length === 0) return [];
  const [features] = await pool.query<FeatureRow[]>(
    "SELECT plan_id AS planId, feature FROM plan_features WHERE plan_id IN (?) ORDER BY plan_id, position",
    [rows.map((row) => row.id)],
  );
  const grouped = new Map<number, string[]>();
  for (const row of features) grouped.set(row.planId, [...(grouped.get(row.planId) ?? []), row.feature]);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    price: row.price,
    durationMonths: row.durationMonths,
    features: grouped.get(row.id) ?? [],
    status: row.status,
  }));
}

export async function listPlans(): Promise<Plan[]> {
  const [rows] = await pool.query<PlanRow[]>(`SELECT ${COLUMNS} FROM plans ORDER BY price ASC, id ASC`);
  return assemble(rows);
}

export async function getPlan(id: number): Promise<Plan | null> {
  const [rows] = await pool.query<PlanRow[]>(`SELECT ${COLUMNS} FROM plans WHERE id = ? LIMIT 1`, [id]);
  return (await assemble(rows))[0] ?? null;
}

async function writeFeatures(connection: PoolConnection, planId: number, features: string[]): Promise<void> {
  await connection.query("INSERT INTO plan_features (plan_id, position, feature) VALUES ?", [
    features.map((feature, index) => [planId, index + 1, feature]),
  ]);
}

// Runs the steps as one unit: if any of them fails, none of them is kept
async function inTransaction<T>(work: (connection: PoolConnection) => Promise<T>): Promise<T> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function createPlan(input: PlanInput): Promise<Plan> {
  const id = await inTransaction(async (connection) => {
    const [result] = await connection.query<ResultSetHeader>(
      "INSERT INTO plans (name, price, duration_months, status) VALUES (?, ?, ?, ?)",
      [input.name, input.price, input.durationMonths, input.status],
    );
    await writeFeatures(connection, result.insertId, input.features);
    return result.insertId;
  });
  const created = await getPlan(id);
  if (!created) throw new Error("Plan was inserted but could not be read back");
  return created;
}

// Writes a complete, already validated plan. Returns false when no plan has this id.
export async function replacePlan(id: number, input: PlanInput): Promise<boolean> {
  return inTransaction(async (connection) => {
    const [result] = await connection.query<ResultSetHeader>(
      "UPDATE plans SET name = ?, price = ?, duration_months = ?, status = ? WHERE id = ?",
      [input.name, input.price, input.durationMonths, input.status, id],
    );
    if (result.affectedRows === 0) return false;
    await connection.query("DELETE FROM plan_features WHERE plan_id = ?", [id]);
    await writeFeatures(connection, id, input.features);
    return true;
  });
}

export async function deletePlan(id: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>("DELETE FROM plans WHERE id = ?", [id]);
  return result.affectedRows === 1;
}
