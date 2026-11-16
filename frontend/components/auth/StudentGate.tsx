"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { clearToken, fetchMe, getToken, type Student } from "@/lib/studentAuth";

interface StudentContextValue {
  student: Student;
  logout: () => void;
}

const StudentContext = createContext<StudentContextValue | null>(null);

// The signed-in student and a logout function, for anything inside the dashboard
export function useStudent(): StudentContextValue {
  const value = useContext(StudentContext);
  if (!value) throw new Error("useStudent must be used inside StudentGate");
  return value;
}

type GateState = { status: "checking" } | { status: "unreachable" } | { status: "ready"; student: Student };

// Wraps every dashboard page. Without a valid login nothing inside is shown and the visitor is
// sent to /login. The server decides: the saved token is checked with GET /api/student/me.
export function StudentGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<GateState>({ status: "checking" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      const token = getToken();
      if (!token) {
        router.replace("/login");
        return;
      }
      const result = await fetchMe(token);
      if (cancelled) return;
      if (result.ok) {
        setState({ status: "ready", student: result.data.student });
      } else if (result.status === 401 || result.status === 403) {
        // The token is wrong, expired, or the account was switched off
        clearToken();
        router.replace("/login");
      } else {
        setState({ status: "unreachable" });
      }
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, [router, attempt]);

  const logout = useCallback(() => {
    clearToken();
    router.replace("/login");
  }, [router]);

  if (state.status === "ready") {
    return <StudentContext.Provider value={{ student: state.student, logout }}>{children}</StudentContext.Provider>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-950 px-4 text-center text-white">
      {state.status === "unreachable" ? (
        <div className="space-y-4">
          <p className="text-sm">Cannot reach the server right now.</p>
          <button
            suppressHydrationWarning
            type="button"
            onClick={() => {
              setState({ status: "checking" });
              setAttempt((value) => value + 1);
            }}
            className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Try again
          </button>
        </div>
      ) : (
        <p role="status" className="text-sm text-white/80">
          Checking your login...
        </p>
      )}
    </div>
  );
}
