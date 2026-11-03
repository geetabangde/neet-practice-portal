"use client";

import { useState } from "react";

// Splits a list into pages. If the list gets shorter (for example after a search),
// the current page is pulled back to the last page that still exists.
export function usePagination<T>(items: T[], pageSize: number) {
  const [requestedPage, setPage] = useState(1);

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(requestedPage, pageCount);
  const start = (page - 1) * pageSize;

  return {
    page,
    setPage,
    pageCount,
    pageItems: items.slice(start, start + pageSize),
    total: items.length,
    from: items.length === 0 ? 0 : start + 1,
    to: Math.min(start + pageSize, items.length),
  };
}
