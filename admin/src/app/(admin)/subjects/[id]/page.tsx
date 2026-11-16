import type { Metadata } from "next";
import { SubjectDetail } from "@/components/subjects/subject-detail";

export const metadata: Metadata = {
  title: "Subject details",
};

export default async function SubjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SubjectDetail id={id} />;
}
