// Talking to the backend's admin login, and remembering the token in this browser.

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000").replace(/\/+$/, "");

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

const TOKEN_KEY = "hn_admin_token";

// Browser storage can throw (private window, blocked site data), so every access is wrapped
export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

// "Remember me" keeps the token after the browser closes (localStorage); otherwise only for this tab session
export function saveToken(token: string, remember: boolean): void {
  clearToken();
  try {
    (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
  } catch {
    // Without storage the admin simply has to sign in again on the next visit
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // nothing to clear
  }
}

interface ApiReply<T> {
  success: boolean;
  message: string;
  data?: T;
}

export type LoginResult = { ok: true; token: string; admin: AdminUser } | { ok: false; message: string };

export async function loginAdmin(email: string, password: string): Promise<LoginResult> {
  try {
    const response = await fetch(`${API_URL}/api/auth/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const reply = (await response.json()) as ApiReply<{ admin: AdminUser; token: string }>;
    if (response.ok && reply.data) return { ok: true, token: reply.data.token, admin: reply.data.admin };
    return { ok: false, message: reply.message || "Sign in failed." };
  } catch {
    return { ok: false, message: "Cannot reach the server. Check your connection and try again." };
  }
}

export type ProfileResult =
  | { status: "ok"; admin: AdminUser }
  | { status: "unauthorized" }
  | { status: "unreachable" };

// Asks the backend who this token belongs to. "unauthorized" means the token is bad or expired.
export async function fetchProfile(token: string): Promise<ProfileResult> {
  try {
    const response = await fetch(`${API_URL}/api/admin/profile`, { headers: { Authorization: `Bearer ${token}` } });
    if (response.status === 401 || response.status === 403) return { status: "unauthorized" };
    if (!response.ok) return { status: "unreachable" };
    const reply = (await response.json()) as ApiReply<{ admin: AdminUser }>;
    return reply.data ? { status: "ok", admin: reply.data.admin } : { status: "unreachable" };
  } catch {
    return { status: "unreachable" };
  }
}
