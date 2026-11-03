import type { ReactNode } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminStoreProvider } from "@/components/providers/admin-store-provider";

// Every page under (admin) gets the sidebar, the header and the shared data store from here.
// The folder name "(admin)" is a route group: it does not appear in the URL.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminStoreProvider>
      <AdminShell>{children}</AdminShell>
    </AdminStoreProvider>
  );
}
