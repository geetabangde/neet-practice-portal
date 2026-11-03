// Next id such as "q-091" for the ids that already exist
export function nextId(prefix: string, existingIds: string[]): string {
  const highest = existingIds.reduce((max, id) => {
    const n = Number(id.slice(prefix.length + 1));
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
  return `${prefix}-${String(highest + 1).padStart(3, "0")}`;
}

// Today as YYYY-MM-DD. Call it from event handlers, not while rendering.
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
