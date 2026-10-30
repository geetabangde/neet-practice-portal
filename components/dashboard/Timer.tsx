"use client";

import { useEffect, useState } from "react";

// Counts up from 0. Give it a new `key` to start it again.
export default function Timer({ label = "Time on this question" }: { label?: string }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <span className="tabular-nums" role="timer" aria-label={label}>
      {mm}:{ss}
    </span>
  );
}
