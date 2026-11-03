// Helpers for building the dummy data. Everything uses plain integer maths (no randomness,
// no Math.sin), so the server and the browser always produce exactly the same values and
// React never reports a hydration mismatch.

// All dates in the dummy data are counted from this day
const REFERENCE = Date.UTC(2026, 9, 30);
const DAY = 86_400_000;

export function daysBefore(days: number): string {
  return new Date(REFERENCE - days * DAY).toISOString().slice(0, 10);
}

export function daysAfter(days: number): string {
  return new Date(REFERENCE + days * DAY).toISOString().slice(0, 10);
}

export function pad(n: number, size = 3): string {
  return String(n).padStart(size, "0");
}

// A repeating list, so index 0..n always has a value: pick(["a", "b"], 3) === "b"
export function pick<T>(list: readonly T[], index: number): T {
  return list[index % list.length];
}
