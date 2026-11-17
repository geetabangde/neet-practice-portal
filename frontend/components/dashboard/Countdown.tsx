"use client";

import { useEffect, useRef, useState } from "react";

// Counts down from the seconds the server says are left. The server keeps the real clock: this only shows it,
// and calls onEnd (once) when it reaches 0 so the test can be handed in.
export default function Countdown({ secondsLeft, onEnd }: { secondsLeft: number; onEnd: () => void }) {
  const [remaining, setRemaining] = useState(secondsLeft);
  // The moment the test ends, worked out once from the clock of this computer
  const endsAt = useRef<number | null>(null);
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  useEffect(() => {
    endsAt.current = Date.now() + secondsLeft * 1000;
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil(((endsAt.current ?? 0) - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        clearInterval(id);
        onEndRef.current();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const hours = Math.floor(remaining / 3600);
  const mm = String(Math.floor((remaining % 3600) / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const low = remaining <= 300;

  return (
    <span className={`tabular-nums ${low ? "font-semibold text-red-600" : ""}`} role="timer" aria-label="Time left">
      {hours > 0 ? `${String(hours).padStart(2, "0")}:` : ""}
      {mm}:{ss}
    </span>
  );
}
