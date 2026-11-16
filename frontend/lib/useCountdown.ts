"use client";

import { useCallback, useEffect, useState } from "react";

// Counts down in whole seconds: start(30) gives 30, 29, 28 ... 0, one step every second.
export function useCountdown() {
  const [seconds, setSeconds] = useState(0);

  // Every change schedules the next step, so the count stops by itself at 0
  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  const start = useCallback((from: number) => setSeconds(Math.max(0, Math.ceil(from))), []);

  return { seconds, start };
}
