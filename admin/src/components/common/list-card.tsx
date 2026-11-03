import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface ListCardProps {
  // Search box and filters
  toolbar?: ReactNode;
  // Usually the pagination
  footer?: ReactNode;
  children: ReactNode;
}

// The white card that holds a list page: filters on top, the table in the middle, pagination below
export function ListCard({ toolbar, footer, children }: ListCardProps) {
  return (
    <Card className="overflow-hidden">
      {toolbar ? <div className="flex flex-wrap items-center gap-3 p-4 sm:p-5">{toolbar}</div> : null}
      {children}
      {footer}
    </Card>
  );
}
