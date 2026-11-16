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

// Who a token belongs to. Admin and student tokens look alike, so every token says which kind it is,
// and each kind of route accepts only its own kind.
export type TokenRole = "admin" | "student";

// What we store inside the JWT. Only the id and the kind: status is re-read from MySQL on every request.
export interface TokenPayload {
  sub: string;
  role: TokenRole;
}
