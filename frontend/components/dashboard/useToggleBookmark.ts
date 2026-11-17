"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { clearToken, getToken } from "@/lib/studentAuth";
import { addBookmark, removeBookmark } from "@/lib/studentContent";

export type ToggleBookmark = (questionId: number, on: boolean) => Promise<{ ok: true } | { ok: false; message: string }>;

// Saves or removes the bookmark of a question on the server. A login the server refuses sends the student
// back to /login. Used by every screen that practises questions.
export function useToggleBookmark(): ToggleBookmark {
  const router = useRouter();

  return useCallback(
    async (questionId: number, on: boolean) => {
      const token = getToken();
      if (!token) {
        router.replace("/login");
        return { ok: false, message: "Please log in again." };
      }
      const result = on ? await addBookmark(token, questionId) : await removeBookmark(token, questionId);
      if (result.ok) return { ok: true };
      if (result.status === 401 || result.status === 403) {
        clearToken();
        router.replace("/login");
      }
      return { ok: false, message: result.message };
    },
    [router],
  );
}
