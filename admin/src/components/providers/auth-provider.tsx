"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { clearToken, fetchProfile, getToken, type AdminUser } from "@/lib/auth";

interface AuthContextValue {
  admin: AdminUser;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthGate");
  return value;
}

type GateState = { status: "checking" } | { status: "unreachable" } | { status: "ready"; admin: AdminUser };

// Wraps every admin page. Without a valid token from the backend, nothing inside is shown
// and the visitor is sent to /login.
export function AuthGate({ children }: { children: ReactNode }) {
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
      const result = await fetchProfile(token);
      if (cancelled) return;
      if (result.status === "ok") {
        setState({ status: "ready", admin: result.admin });
      } else if (result.status === "unauthorized") {
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
    return <AuthContext.Provider value={{ admin: state.admin, logout }}>{children}</AuthContext.Provider>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-tint px-4 text-center">
      {state.status === "unreachable" ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-700">Cannot reach the server right now.</p>
          <Button
            onClick={() => {
              setState({ status: "checking" });
              setAttempt((value) => value + 1);
            }}
          >
            Try again
          </Button>
        </div>
      ) : (
        <p role="status" className="text-sm text-slate-500">
          Checking your session…
        </p>
      )}
    </div>
  );
}
