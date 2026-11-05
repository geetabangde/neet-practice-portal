import mysql, { type Pool } from "mysql2/promise";

// One shared pool for the whole backend. server.ts loads dotenv before this file is imported,
// so process.env already holds the values from backend/.env.
export const pool: Pool = mysql.createPool({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "neet_pg_portal",
  // When all connections are busy, wait for a free one instead of failing
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Fail in 5 seconds when MySQL is off, instead of hanging
  connectTimeout: 5000,
});

// Used by the health check: borrow a connection, ping MySQL, give the connection back
export async function checkDatabase(): Promise<void> {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
}
