import { Badge, type BadgeTone } from "@/components/ui/badge";
import type {
  ActiveStatus,
  Difficulty,
  NotificationStatus,
  PaymentMethod,
  PaymentStatus,
  QuestionStatus,
  TestStatus,
} from "@/types";

interface StatusStyle {
  label: string;
  tone: BadgeTone;
}

// Makes a badge component from a table of "value -> label and colour". Every kind of status in
// the panel (student, question, test, payment ...) uses the same look this way.
function createStatusBadge<T extends string>(styles: Record<T, StatusStyle>, dot = true) {
  return function StatusBadge({ status }: { status: T }) {
    const { label, tone } = styles[status];
    return (
      <Badge tone={tone} dot={dot}>
        {label}
      </Badge>
    );
  };
}

export const ActiveBadge = createStatusBadge<ActiveStatus>({
  active: { label: "Active", tone: "green" },
  inactive: { label: "Inactive", tone: "slate" },
});

export const QuestionStatusBadge = createStatusBadge<QuestionStatus>({
  published: { label: "Published", tone: "green" },
  draft: { label: "Draft", tone: "amber" },
});

export const TestStatusBadge = createStatusBadge<TestStatus>({
  draft: { label: "Draft", tone: "amber" },
  published: { label: "Published", tone: "blue" },
  completed: { label: "Completed", tone: "green" },
});

export const PaymentStatusBadge = createStatusBadge<PaymentStatus>({
  success: { label: "Success", tone: "green" },
  pending: { label: "Pending", tone: "amber" },
  failed: { label: "Failed", tone: "red" },
  refunded: { label: "Refunded", tone: "violet" },
});

export const NotificationStatusBadge = createStatusBadge<NotificationStatus>({
  sent: { label: "Sent", tone: "green" },
  scheduled: { label: "Scheduled", tone: "blue" },
  draft: { label: "Draft", tone: "amber" },
});

export const DifficultyBadge = createStatusBadge<Difficulty>(
  {
    easy: { label: "Easy", tone: "green" },
    medium: { label: "Medium", tone: "amber" },
    hard: { label: "Hard", tone: "red" },
  },
  false,
);

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  upi: "UPI",
  card: "Card",
  netbanking: "Net banking",
  wallet: "Wallet",
};
