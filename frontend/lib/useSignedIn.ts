"use client";

import { useSyncExternalStore } from "react";
import { getToken } from "./studentAuth";

function subscribe(onChange: () => void) {
  // "storage" fires when another tab logs in or out; this tab re-reads when the page opens
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

// true when a student is logged in on this computer. The server (and the first paint) say false,
// so the page matches on both sides, then it switches once the browser has read the saved login.
export function useSignedIn(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => getToken() !== null,
    () => false,
  );
}
