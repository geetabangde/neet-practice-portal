import type { Metadata } from "next";
import { ResultDetail } from "@/components/results/result-detail";

export const metadata: Metadata = {
  title: "Result details",
};

export default async function ResultDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ResultDetail id={id} />;
}
