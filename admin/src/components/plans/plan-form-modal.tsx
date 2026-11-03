"use client";

import { useState, type FormEvent } from "react";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/form-controls";
import { Modal } from "@/components/ui/modal";
import { nextId } from "@/lib/ids";
import type { ActiveStatus, Plan } from "@/types";

const FORM_ID = "plan-form";

// "new" = adding, a Plan = editing it, null = closed
export type PlanModalState = Plan | "new" | null;

interface PlanErrors {
  name?: string;
  price?: string;
  durationMonths?: string;
  features?: string;
}

function PlanForm({ plan, onSaved }: { plan: Plan | null; onSaved: () => void }) {
  const { plans } = useAdminStore();
  const toast = useToast();

  const [name, setName] = useState(plan?.name ?? "");
  const [price, setPrice] = useState(plan ? String(plan.price) : "");
  const [durationMonths, setDurationMonths] = useState(plan ? String(plan.durationMonths) : "12");
  // One feature per line while typing
  const [features, setFeatures] = useState(plan ? plan.features.join("\n") : "");
  const [status, setStatus] = useState<ActiveStatus>(plan?.status ?? "active");
  const [errors, setErrors] = useState<PlanErrors>({});

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: PlanErrors = {};
    const featureList = features.split("\n").map((line) => line.trim()).filter(Boolean);

    if (!name.trim()) found.name = "Enter the plan name.";
    else if (plans.items.some((p) => p.id !== plan?.id && p.name.toLowerCase() === name.trim().toLowerCase())) {
      found.name = "A plan with this name already exists.";
    }
    if (price === "" || Number(price) < 0 || !Number.isFinite(Number(price))) found.price = "Enter a price (0 for a free plan).";
    if (!(Number(durationMonths) >= 1)) found.durationMonths = "Enter the duration in months.";
    if (featureList.length === 0) found.features = "Add at least one feature.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const values = {
      name: name.trim(),
      price: Math.round(Number(price)),
      durationMonths: Math.round(Number(durationMonths)),
      features: featureList,
      status,
    };

    if (plan) {
      plans.update(plan.id, values);
      toast({ title: "Plan updated", description: `${values.name} was saved (demo data).` });
    } else {
      plans.add({ id: nextId("p", plans.items.map((p) => p.id)), ...values });
      toast({ title: "Plan added", description: `${values.name} was added (demo data).` });
    }
    onSaved();
  }

  return (
    <form id={FORM_ID} onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      <TextField label="Plan name" required value={name} onChange={(e) => setName(e.target.value)} error={errors.name} wrapperClassName="sm:col-span-2" />
      <TextField label="Price (₹)" required type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} error={errors.price} />
      <TextField label="Duration (months)" required type="number" min={1} value={durationMonths} onChange={(e) => setDurationMonths(e.target.value)} error={errors.durationMonths} />
      <TextAreaField
        label="Features"
        required
        rows={5}
        value={features}
        onChange={(e) => setFeatures(e.target.value)}
        error={errors.features}
        hint="Write one feature on each line."
        wrapperClassName="sm:col-span-2"
      />
      <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value as ActiveStatus)} wrapperClassName="sm:col-span-2">
        <option value="active">Active (can be bought)</option>
        <option value="inactive">Inactive (hidden from students)</option>
      </SelectField>
    </form>
  );
}

export function PlanFormModal({ state, onClose }: { state: PlanModalState; onClose: () => void }) {
  const editing = state !== null && state !== "new" ? state : null;

  return (
    <Modal
      open={state !== null}
      onClose={onClose}
      title={editing ? "Edit plan" : "Add plan"}
      description={editing ? "Change the plan's price, duration or features." : "Create a new subscription plan."}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID}>
            {editing ? "Save changes" : "Add plan"}
          </Button>
        </>
      }
    >
      {state !== null ? <PlanForm key={editing?.id ?? "new"} plan={editing} onSaved={onClose} /> : null}
    </Modal>
  );
}
