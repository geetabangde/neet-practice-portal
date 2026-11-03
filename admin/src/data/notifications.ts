import type { AdminNotification } from "@/types";
import { daysAfter, daysBefore } from "./helpers";

export const notificationsData: AdminNotification[] = [
  {
    id: "n-001",
    title: "National INI-CET Mock is live",
    message: "The National INI-CET Mock 2025 Nov Session is open until next week. Attempt it before the window closes.",
    audience: "all",
    sendAt: daysBefore(2),
    status: "sent",
  },
  {
    id: "n-002",
    title: "Grand Test 4 starts soon",
    message: "Grand Test 4 - NEET Pattern begins in nine days. Revise your weak chapters using Magic Module.",
    audience: "active",
    sendAt: daysAfter(5),
    status: "scheduled",
  },
  {
    id: "n-003",
    title: "We miss you!",
    message: "Your account has been inactive for a while. Log in and continue where you stopped.",
    audience: "inactive",
    sendAt: daysBefore(6),
    status: "sent",
  },
  {
    id: "n-004",
    title: "New questions added",
    message: "New questions were added to Biochemistry and Pharmacology. Open the QBank to try them.",
    audience: "premium",
    sendAt: daysBefore(9),
    status: "sent",
  },
  {
    id: "n-005",
    title: "Plan renewal reminder",
    message: "Your plan expires soon. Renew now to keep full access to tests and the question bank.",
    audience: "premium",
    sendAt: daysAfter(12),
    status: "draft",
  },
  {
    id: "n-006",
    title: "Maintenance window",
    message: "The platform will be unavailable for a short time on Sunday night for scheduled maintenance.",
    audience: "all",
    sendAt: daysBefore(15),
    status: "sent",
  },
  {
    id: "n-007",
    title: "Welcome to HN QBank",
    message: "Thanks for joining. Start with a free module in any subject and see how a session feels.",
    audience: "all",
    sendAt: daysBefore(30),
    status: "sent",
  },
];
