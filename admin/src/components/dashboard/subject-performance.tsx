"use client";

import { useEffect, useState } from "react";
import { BarList } from "@/components/charts/bar-list";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { fetchAnalytics } from "@/lib/analytics-api";
import type { ChartPoint } from "@/types";

type Loaded = { data: ChartPoint[] } | { error: true };

// Dashboard card: how students did in each subject over the last 30 days, from the real test answers
export function SubjectPerformance() {
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const result = await fetchAnalytics("30d");
      if (cancelled) return;
      setLoaded(result.ok ? { data: result.data.subjectPerformance } : { error: true });
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Best subject first
  const data = loaded && "data" in loaded ? [...loaded.data].sort((a, b) => b.value - a.value) : [];

  return (
    <Card className="h-full">
      <CardHeader title="Subject-wise performance" description="Share of answers that were right, last 30 days" />
      <CardContent>
        {loaded === null ? (
          <p role="status" className="text-sm text-slate-500">
            Loading...
          </p>
        ) : "error" in loaded ? (
          <p className="text-sm text-red-600">Could not load this from the server.</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-slate-500">No test answers in the last 30 days yet.</p>
        ) : (
          <BarList data={data} measure="accuracy" />
        )}
      </CardContent>
    </Card>
  );
}
