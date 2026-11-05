import type { RowDataPacket } from "mysql2";

export type AdminStatus = "active" | "inactive";

// One row of the "admins" table, exactly as MySQL returns it. It includes the password hash,
// so this type must never be sent to a client.
export interface AdminRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  status: AdminStatus;
}

// The only admin fields that may leave the server
export interface SafeAdmin {
  id: number;
  name: string;
  email: string;
  role: string;
}

// What we store inside the JWT. Only the id: role and status are re-read from MySQL on every request.
export interface AdminTokenPayload {
  sub: string;
}
