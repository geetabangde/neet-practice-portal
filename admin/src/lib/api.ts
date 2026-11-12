import { API_URL, clearToken, getToken } from "@/lib/auth";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; message: string };

interface ApiReply<T> {
  success: boolean;
  message: string;
  data?: T;
}

// Calls a protected backend route with the admin's token.
// A 401 means the session is over, so the token is dropped and the admin goes back to /login.
export async function apiRequest<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<ApiResult<T>> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers: {
        Authorization: `Bearer ${getToken() ?? ""}`,
        ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
    const reply = (await response.json().catch(() => null)) as ApiReply<T> | null;
    if (response.status === 401) {
      clearToken();
      // A full page load on purpose: it wipes all in-memory admin data of the ended session
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/login";
    }
    if (response.ok && reply?.success) return { ok: true, data: reply.data as T };
    return { ok: false, status: response.status, message: reply?.message || "Something went wrong." };
  } catch {
    return { ok: false, status: 0, message: "Cannot reach the server. Check your connection and try again." };
  }
}
