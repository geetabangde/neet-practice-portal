import type { Metadata } from "next";
import { StudentDetails } from "@/components/students/student-details";

export const metadata: Metadata = {
  title: "Student details",
};

// In Next.js 16 the URL parts (here: the student id) arrive as a Promise, so we await them
export default async function StudentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudentDetails id={id} />;
}
