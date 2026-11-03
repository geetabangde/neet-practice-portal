"use client";

import { Bell, Megaphone, Send, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { ListCard } from "@/components/common/list-card";
import { RowActions, type RowAction } from "@/components/common/row-actions";
import { NotificationStatusBadge } from "@/components/common/status-badges";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { SelectField, TextAreaField, TextField } from "@/components/ui/form-controls";
import { Pagination } from "@/components/ui/pagination";
import { Segmented } from "@/components/ui/segmented";
import { Tabs } from "@/components/ui/tabs";
import { usePagination } from "@/hooks/use-pagination";
import { formatDate, plural } from "@/lib/format";
import { nextId, todayIso } from "@/lib/ids";
import type { AdminNotification, NotificationAudience, NotificationStatus } from "@/types";

const MESSAGE_LIMIT = 240;
const PAGE_SIZE = 6;

const audienceLabels: Record<NotificationAudience, string> = {
  all: "All students",
  active: "Active students",
  inactive: "Inactive students",
  premium: "Students with a paid plan",
};

type StatusFilter = "all" | NotificationStatus;
type Delivery = "now" | "schedule";

interface FormErrors {
  title?: string;
  message?: string;
  date?: string;
}

export function NotificationsView() {
  const { notifications, students, plans } = useAdminStore();
  const toast = useToast();

  // Form
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<NotificationAudience>("all");
  const [delivery, setDelivery] = useState<Delivery>("now");
  const [date, setDate] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  // History
  const [status, setStatus] = useState<StatusFilter>("all");
  const [deleting, setDeleting] = useState<AdminNotification | null>(null);

  const paidPlanIds = new Set(plans.items.filter((p) => p.price > 0).map((p) => p.id));
  const reach = (target: NotificationAudience) =>
    students.items.filter((s) => {
      if (target === "active") return s.status === "active";
      if (target === "inactive") return s.status === "inactive";
      if (target === "premium") return s.planId !== null && paidPlanIds.has(s.planId);
      return true;
    }).length;

  function validate(requireDate: boolean): FormErrors {
    const found: FormErrors = {};
    if (!title.trim()) found.title = "Write a title.";
    if (!message.trim()) found.message = "Write the message.";
    if (requireDate) {
      if (!date) found.date = "Choose the day to send it.";
      else if (date < todayIso()) found.date = "Choose today or a later day.";
    }
    return found;
  }

  function submit(mode: "send" | "draft") {
    const scheduled = mode === "send" && delivery === "schedule";
    const found = validate(scheduled);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const savedStatus: NotificationStatus = mode === "draft" ? "draft" : scheduled ? "scheduled" : "sent";
    notifications.add({
      id: nextId("n", notifications.items.map((n) => n.id)),
      title: title.trim(),
      message: message.trim(),
      audience,
      sendAt: scheduled ? date : todayIso(),
      status: savedStatus,
    });

    toast({
      title: savedStatus === "sent" ? "Notification sent" : savedStatus === "scheduled" ? "Notification scheduled" : "Draft saved",
      description:
        savedStatus === "sent"
          ? `Sent to ${plural(reach(audience), "student")} (demo: nothing was really sent).`
          : "Saved in the history below (demo data).",
    });

    setTitle("");
    setMessage("");
    setDate("");
    setErrors({});
  }

  function sendNow(notification: AdminNotification) {
    notifications.update(notification.id, { status: "sent", sendAt: todayIso() });
    toast({ title: "Notification sent", description: `${notification.title} (demo: nothing was really sent).` });
  }

  const sorted = [...notifications.items].sort((a, b) => b.sendAt.localeCompare(a.sendAt) || b.id.localeCompare(a.id));
  const filtered = sorted.filter((n) => status === "all" || n.status === status);
  const pagination = usePagination(filtered, PAGE_SIZE);
  const countOf = (value: NotificationStatus) => notifications.items.filter((n) => n.status === value).length;

  const columns: Column<AdminNotification>[] = [
    {
      key: "title",
      header: "Notification",
      primary: true,
      className: "max-w-sm",
      cell: (n) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{n.title}</p>
          <p className="line-clamp-2 text-xs text-slate-500">{n.message}</p>
        </div>
      ),
    },
    { key: "audience", header: "Audience", hideBelow: "lg", cell: (n) => <Badge tone="slate">{audienceLabels[n.audience]}</Badge> },
    { key: "date", header: "Send date", cell: (n) => <span className="whitespace-nowrap">{formatDate(n.sendAt)}</span> },
    { key: "status", header: "Status", cell: (n) => <NotificationStatusBadge status={n.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Send messages to students, schedule them for later, and see what was sent before."
      />

      <div className="grid gap-6 xl:grid-cols-[400px_1fr]">
        <Card className="h-fit">
          <CardHeader title="Create notification" description="Students see it in their notification bell" />
          <CardContent>
            <form onSubmit={(event) => event.preventDefault()} noValidate className="space-y-4">
              <TextField
                label="Title"
                required
                maxLength={80}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setErrors((prev) => ({ ...prev, title: undefined }));
                }}
                error={errors.title}
                placeholder="e.g. Grand Test 6 starts tomorrow"
              />
              <div>
                <TextAreaField
                  label="Message"
                  required
                  rows={4}
                  maxLength={MESSAGE_LIMIT}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    setErrors((prev) => ({ ...prev, message: undefined }));
                  }}
                  error={errors.message}
                  placeholder="Write a short message…"
                />
                <p className="mt-1 text-right text-xs text-slate-400">
                  {message.length}/{MESSAGE_LIMIT}
                </p>
              </div>
              <SelectField
                label="Target audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value as NotificationAudience)}
                hint={`This reaches ${plural(reach(audience), "student")}.`}
              >
                {(Object.keys(audienceLabels) as NotificationAudience[]).map((value) => (
                  <option key={value} value={value}>
                    {audienceLabels[value]}
                  </option>
                ))}
              </SelectField>

              <div>
                <p className="mb-1.5 text-sm font-medium text-slate-700">Delivery</p>
                <Segmented
                  ariaLabel="Delivery"
                  value={delivery}
                  onChange={setDelivery}
                  options={[
                    { value: "now", label: "Send now" },
                    { value: "schedule", label: "Schedule" },
                  ]}
                />
              </div>
              {delivery === "schedule" ? (
                <TextField
                  label="Send on"
                  required
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setErrors((prev) => ({ ...prev, date: undefined }));
                  }}
                  error={errors.date}
                />
              ) : null}

              <div className="flex flex-wrap gap-2 pt-1">
                <Button leftIcon={<Send className="h-4 w-4" />} onClick={() => submit("send")}>
                  {delivery === "now" ? "Send notification" : "Schedule"}
                </Button>
                <Button variant="outline" leftIcon={<Save className="h-4 w-4" />} onClick={() => submit("draft")}>
                  Save draft
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="min-w-0">
          <ListCard
            toolbar={
              <>
                <h2 className="mr-auto flex items-center gap-2 text-base font-semibold text-slate-900">
                  <Megaphone className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  Notification history
                </h2>
                <Tabs
                  ariaLabel="Filter by status"
                  value={status}
                  onChange={setStatus}
                  tabs={[
                    { value: "all", label: "All", count: notifications.items.length },
                    { value: "sent", label: "Sent", count: countOf("sent") },
                    { value: "scheduled", label: "Scheduled", count: countOf("scheduled") },
                    { value: "draft", label: "Drafts", count: countOf("draft") },
                  ]}
                />
              </>
            }
            footer={
              <Pagination
                page={pagination.page}
                pageCount={pagination.pageCount}
                onPageChange={pagination.setPage}
                from={pagination.from}
                to={pagination.to}
                total={pagination.total}
                noun="notifications"
              />
            }
          >
            <DataTable
              caption="Notification history"
              columns={columns}
              rows={pagination.pageItems}
              getRowId={(n) => n.id}
              empty={<EmptyState icon={Bell} title="Nothing here yet" description="Notifications you send or save will appear here." />}
              actions={(n) => {
                const actions: RowAction[] = [];
                if (n.status !== "sent") actions.push({ label: `Send ${n.title} now`, icon: Send, onClick: () => sendNow(n) });
                actions.push({ label: `Delete ${n.title}`, icon: Trash2, onClick: () => setDeleting(n), danger: true });
                return <RowActions actions={actions} />;
              }}
            />
          </ListCard>
        </div>
      </div>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          notifications.remove(deleting.id);
          toast({ title: "Notification deleted", description: deleting.title });
        }}
        title="Delete this notification?"
        description={
          deleting ? (
            <>
              <strong className="text-slate-900">{deleting.title}</strong> will be removed from the history. Students who already
              received it keep it.
            </>
          ) : null
        }
        confirmLabel="Delete"
      />
    </>
  );
}
