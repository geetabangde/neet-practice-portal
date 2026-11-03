"use client";

import { Download } from "lucide-react";
import Link from "next/link";
import { PaymentStatusBadge, paymentMethodLabels } from "@/components/common/status-badges";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Payment } from "@/types";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-3">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-slate-900">{children}</dd>
    </div>
  );
}

interface PaymentDetailsModalProps {
  // null = closed
  payment: Payment | null;
  onClose: () => void;
}

export function PaymentDetailsModal({ payment, onClose }: PaymentDetailsModalProps) {
  const { students, plans } = useAdminStore();
  const toast = useToast();

  const student = payment ? students.items.find((s) => s.id === payment.studentId) : undefined;
  const plan = payment ? plans.items.find((p) => p.id === payment.planId) : undefined;

  return (
    <Modal
      open={payment !== null}
      onClose={onClose}
      title="Transaction details"
      description={payment?.id}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            leftIcon={<Download className="h-4 w-4" />}
            onClick={() => toast({ title: "Receipt download started", description: "Demo only: no file is created yet." })}
          >
            Download receipt
          </Button>
        </>
      }
    >
      {payment ? (
        <dl className="divide-y divide-slate-100">
          <Row label="Status">
            <PaymentStatusBadge status={payment.status} />
          </Row>
          <Row label="Amount">{formatCurrency(payment.amount)}</Row>
          <Row label="Student">
            {student ? (
              <Link href={`/students/${student.id}`} className="text-indigo-600 hover:text-indigo-700">
                {student.name}
              </Link>
            ) : (
              "Deleted student"
            )}
          </Row>
          <Row label="Email">{student?.email ?? "—"}</Row>
          <Row label="Plan">{plan?.name ?? "Deleted plan"}</Row>
          <Row label="Payment method">{paymentMethodLabels[payment.method]}</Row>
          <Row label="Payment date">{formatDate(payment.paidAt)}</Row>
          <Row label="Gateway reference">
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{payment.gatewayRef}</code>
          </Row>
        </dl>
      ) : null}
    </Modal>
  );
}
