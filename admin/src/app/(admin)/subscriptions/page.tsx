import type { Metadata } from "next";
import { PlansView } from "@/components/plans/plans-view";

export const metadata: Metadata = {
  title: "Subscription plans",
};

export default function SubscriptionsPage() {
  return <PlansView />;
}
