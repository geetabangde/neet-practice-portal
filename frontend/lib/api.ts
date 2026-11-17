// Talking to the backend. The address comes from NEXT_PUBLIC_API_URL (set it when the site is built).

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000").replace(/\/+$/, "");

// retryAfterSeconds is set when the server says "wait N seconds and try again"
export type ApiResult<T> =
  | { ok: true; data: T; message: string }
  | { ok: false; status: number; message: string; retryAfterSeconds?: number };

interface ApiReply<T> {
  success: boolean;
  message: string;
  data?: T;
}

// Sends a request and turns the answer into a plain result, so screens never have to deal with
// network errors or odd answers themselves.
async function request<T>(path: string, init: RequestInit): Promise<ApiResult<T>> {
  try {
    const response = await fetch(`${API_URL}${path}`, init);
    const reply = (await response.json().catch(() => null)) as ApiReply<T> | null;
    if (response.ok && reply?.success) return { ok: true, data: reply.data as T, message: reply.message };
    const wait = (reply?.data as { retryAfterSeconds?: unknown } | undefined)?.retryAfterSeconds;
    return {
      ok: false,
      status: response.status,
      message: reply?.message || "Something went wrong. Please try again.",
      ...(typeof wait === "number" ? { retryAfterSeconds: wait } : {}),
    };
  } catch {
    return { ok: false, status: 0, message: "Cannot reach the server. Check your connection and try again." };
  }
}

// token is for the calls only a signed-in student may make (like sending an answer)
export function apiPost<T>(path: string, body: unknown, token?: string): Promise<ApiResult<T>> {
  return request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
}

export function apiPut<T>(path: string, token: string, body?: unknown): Promise<ApiResult<T>> {
  return request<T>(path, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

export function apiDelete<T>(path: string, token: string): Promise<ApiResult<T>> {
  return request<T>(path, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
}

export function apiGet<T>(path: string, token: string): Promise<ApiResult<T>> {
  return request<T>(path, { headers: { Authorization: `Bearer ${token}` } });
}
