"use client";

import { Check, Crown, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { ActiveBadge } from "@/components/common/status-badges";
import { PageHeader } from "@/components/common/page-header";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button, IconButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Switch } from "@/components/ui/form-controls";
import { cn } from "@/lib/cn";
import { formatCurrency, plural } from "@/lib/format";
import type { Plan } from "@/types";
import { PlanFormModal, type PlanModalState } from "./plan-form-modal";

export function PlansView() {
  const { plans, students } = useAdminStore();
  const toast = useToast();

  const [modal, setModal] = useState<PlanModalState>(null);
  const [deleting, setDeleting] = useState<Plan | null>(null);

  const studentCount = (planId: string) => students.items.filter((s) => s.planId === planId).length;
  // The plan with the most students gets a "Most popular" ribbon
  const mostPopularId = [...plans.items].sort((a, b) => studentCount(b.id) - studentCount(a.id))[0]?.id;

  function remove(plan: Plan) {
    // Students on the deleted plan are left without a plan
    students.setItems((prev) =>
      prev.map((s) => (s.planId === plan.id ? { ...s, planId: null, planExpiresAt: null } : s)),
    );
    plans.remove(plan.id);
    toast({ title: "Plan deleted", description: plan.name });
  }

  return (
    <>
      <PageHeader
        title="Subscription plans"
        description="The plans students can buy. Inactive plans are hidden from the student site."
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setModal("new")}>
            Add plan
          </Button>
        }
      />

      {plans.items.length === 0 ? (
        <Card>
          <EmptyState
            icon={Crown}
            title="No plans yet"
            description="Add your first plan so students can subscribe."
            action={<Button onClick={() => setModal("new")}>Add plan</Button>}
          />
        </Card>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {plans.items.map((plan) => {
            const count = studentCount(plan.id);
            const popular = plan.id === mostPopularId && count > 0;
            return (
              <li key={plan.id}>
                <Card className={cn("relative flex h-full flex-col p-6", popular && "border-indigo-300 ring-1 ring-indigo-200", plan.status === "inactive" && "opacity-75")}>
                  {popular ? (
                    <span className="absolute right-5 top-5 rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                      Most popular
                    </span>
                  ) : null}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">{plan.name}</h2>
                      <div className="mt-1">
                        <ActiveBadge status={plan.status} />
                      </div>
                    </div>
                  </div>

                  <p className="mt-5 flex items-baseline gap-1.5">
                    <span className="text-4xl font-semibold tracking-tight text-slate-900">
                      {plan.price === 0 ? "Free" : formatCurrency(plan.price)}
                    </span>
                    <span className="text-sm text-slate-500">/ {plural(plan.durationMonths, "month")}</span>
                  </p>

                  <ul className="mt-5 flex-1 space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-600">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
                    <p className="flex items-center gap-1.5 text-sm text-slate-500">
                      <Users className="h-4 w-4" aria-hidden="true" />
                      {plural(count, "student")}
                    </p>
                    <div className="flex items-center gap-1">
                      <Switch
                        label={`${plan.name} is active`}
                        checked={plan.status === "active"}
                        onChange={(checked) => {
                          plans.update(plan.id, { status: checked ? "active" : "inactive" });
                          toast({ title: checked ? "Plan activated" : "Plan deactivated", description: plan.name });
                        }}
                      />
                      <IconButton label={`Edit ${plan.name}`} onClick={() => setModal(plan)}>
                        <Pencil className="h-4 w-4" />
                      </IconButton>
                      <IconButton label={`Delete ${plan.name}`} onClick={() => setDeleting(plan)} className="hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <PlanFormModal state={modal} onClose={() => setModal(null)} />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) remove(deleting);
        }}
        title="Delete this plan?"
        description={
          deleting ? (
            <>
              <strong className="text-slate-900">{deleting.name}</strong> will be deleted.{" "}
              {studentCount(deleting.id) > 0 ? (
                <>
                  The <strong>{plural(studentCount(deleting.id), "student")}</strong> on this plan will be left without a plan.{" "}
                </>
              ) : null}
              This cannot be undone.
            </>
          ) : null
        }
        confirmLabel="Delete plan"
      />
    </>
  );
}
