import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { StudentsView } from "@/components/students/students-view";

export const metadata: Metadata = {
  title: "Students",
};

export default function StudentsPage() {
  return (
    <>
      <PageHeader title="Students" description="See every registered student, their plan and account status." />
      <StudentsView />
    </>
  );
}
