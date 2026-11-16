// Prints one SQL line that creates an admin, for phpMyAdmin on a server with no terminal.
// Run with: npm run admin:sql --silent -- "Your Name" "you@example.com" "your password" > admin.sql
// then import admin.sql in phpMyAdmin (Import tab), after importing setup.sql.
// The password is turned into a bcrypt hash here. Only the hash is printed, never the password.
import { hashPassword } from "../services/auth.service";

const text = (value: string) => `'${value.replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;

async function main(): Promise<void> {
  const [name, rawEmail, password] = process.argv.slice(2);
  const email = rawEmail?.trim().toLowerCase();

  if (!name?.trim() || !email || !password) {
    throw new Error('Usage: npm run admin:sql -- "Your Name" "you@example.com" "your password"');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("That email address is not valid");
  if (password.length < 8 || password.length > 72) throw new Error("The password must be 8 to 72 characters");

  const hash = await hashPassword(password);
  // The hint goes to stderr and the SQL to stdout, so "> admin.sql" saves only the SQL
  console.error("Done. Import the saved file in phpMyAdmin (Import tab), or paste the line below into the SQL tab.");
  console.log(
    `INSERT IGNORE INTO admins (name, email, password, role, status) VALUES (${text(name.trim())}, ${text(email)}, ${text(hash)}, 'admin', 'active');`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
