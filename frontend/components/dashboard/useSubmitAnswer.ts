"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { clearToken, getToken } from "@/lib/studentAuth";
import { submitAnswer, type Letter } from "@/lib/studentContent";
import type { SubmitAnswer } from "./PracticeView";

// Sends one answer to the server (which marks it and saves it). A login the server refuses sends the
// student back to /login. Used by every screen that practises questions.
export function useSubmitAnswer(): SubmitAnswer {
  const router = useRouter();

  return useCallback(
    async (questionId: number, selected: Letter[]) => {
      const token = getToken();
      if (!token) {
        router.replace("/login");
        return { ok: false, message: "Please log in again." };
      }
      const result = await submitAnswer(token, questionId, selected);
      if (result.ok) return { ok: true, feedback: result.data };
      if (result.status === 401 || result.status === 403) {
        clearToken();
        router.replace("/login");
      }
      return { ok: false, message: result.message };
    },
    [router],
  );
}
