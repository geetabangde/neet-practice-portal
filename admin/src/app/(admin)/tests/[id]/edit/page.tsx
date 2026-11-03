import type { Metadata } from "next";
import { TestEditor } from "@/components/tests/test-editor";

export const metadata: Metadata = {
  title: "Edit test",
};

export default async function EditTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TestEditor id={id} />;
}
