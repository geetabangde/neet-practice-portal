"use client";

import { useCallback, useState } from "react";

// A list of records (students, subjects, ...) with add / update / remove.
// The list lives in React state, so it resets when the page is refreshed.
export function useCollection<T extends { id: string }>(initial: T[]) {
  const [items, setItems] = useState<T[]>(initial);

  // New records go to the top of the list
  const add = useCallback((item: T) => setItems((prev) => [item, ...prev]), []);

  const update = useCallback(
    (id: string, patch: Partial<T>) =>
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item))),
    [],
  );

  const remove = useCallback(
    (id: string) => setItems((prev) => prev.filter((item) => item.id !== id)),
    [],
  );

  return { items, setItems, add, update, remove };
}

export type Collection<T extends { id: string }> = ReturnType<typeof useCollection<T>>;
