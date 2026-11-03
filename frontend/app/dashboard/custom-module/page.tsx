import type { Metadata } from "next";
import Link from "next/link";
import CustomModuleForm from "@/components/dashboard/CustomModuleForm";
import DashboardShell from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = {
  title: "Create a Custom Module | HN QBank",
  robots: { index: false },
};

export default function CustomModulePage() {
  return (
    <DashboardShell title="QBank Edition 8">
      <nav aria-label="Breadcrumb" className="text-xs">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/dashboard" className="text-accent-dark hover:underline">
              QBank
            </Link>
          </li>
          <li aria-hidden="true">&gt;</li>
          <li>Custom Module</li>
          <li aria-hidden="true">&gt;</li>
          <li aria-current="page">Create</li>
        </ol>
      </nav>

      <h1 className="mt-4 text-2xl font-bold">Create a Custom Module</h1>
      <p className="mt-1 text-xs">Customize an MCQ set by adding your own parameters</p>

      <CustomModuleForm />
    </DashboardShell>
  );
}
