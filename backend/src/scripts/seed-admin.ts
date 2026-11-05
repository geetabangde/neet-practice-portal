// One-time setup: creates the "admins" table and the first admin. Run with: npm run seed:admin
import "dotenv/config";
import { pool } from "../config/db";
import { hashPassword } from "../services/auth.service";

const CREATE_ADMINS_TABLE = `
  CREATE TABLE IF NOT EXISTS admins (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(190) NOT NULL,
    password   VARCHAR(255) NOT NULL,
    role       VARCHAR(30)  NOT NULL DEFAULT 'admin',
    status     ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_admins_email (email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

async function main(): Promise<void> {
  const name = process.env.INITIAL_ADMIN_NAME?.trim();
  const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.INITIAL_ADMIN_PASSWORD;

  if (!name || !email || !password) {
    throw new Error("Set INITIAL_ADMIN_NAME, INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD in .env first");
  }
  if (password.length < 8 || password.length > 72) {
    throw new Error("INITIAL_ADMIN_PASSWORD must be 8 to 72 characters");
  }

  await pool.query(CREATE_ADMINS_TABLE);

  // INSERT IGNORE + the UNIQUE email key: running the script twice never creates a duplicate
  const [result] = await pool.query(
    "INSERT IGNORE INTO admins (name, email, password, role, status) VALUES (?, ?, ?, 'admin', 'active')",
    [name, email, await hashPassword(password)],
  );
  const created = "affectedRows" in result && result.affectedRows === 1;
  console.log(created ? `Admin created: ${email}` : `Admin ${email} already exists, nothing changed`);
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
.finally(() => pool.end());
