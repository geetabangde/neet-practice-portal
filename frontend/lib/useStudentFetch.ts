"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { ApiResult } from "@/lib/api";
import { clearToken, getToken } from "@/lib/studentAuth";

export type FetchState<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "notFound" }
  | { status: "error"; message: string };

// Loads something for the signed-in student when the screen opens.
// No login, or a login the server refuses, sends the student to /login.
// "load" must keep the same identity between renders (a function outside the component, or useCallback),
// otherwise the screen would load again on every render.
export function useStudentFetch<T>(load: (token: string) => Promise<ApiResult<T>>) {
  const router = useRouter();
  const [state, setState] = useState<FetchState<T>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const token = getToken();
      if (!token) {
        router.replace("/login");
        return;
      }
      const result = await load(token);
      if (cancelled) return;
      if (result.ok) {
        setState({ status: "ready", data: result.data });
      } else if (result.status === 401 || result.status === 403) {
        clearToken();
        router.replace("/login");
      } else if (result.status === 404 && result.message !== "Route not found") {
        // The thing asked for does not exist. "Route not found" is different: the server itself does not know
        // this address (an old version is running), so that is shown as an error, not as "not found".
        setState({ status: "notFound" });
      } else {
        setState({ status: "error", message: result.message });
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [load, router, attempt]);

  // For the "Try again" button
  const reload = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((value) => value + 1);
  }, []);

  return { state, reload };
}
