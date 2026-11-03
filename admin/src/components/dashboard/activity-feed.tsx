import { ClipboardList, FileQuestion, IndianRupee, Server, UserPlus, type LucideIcon } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { recentActivities } from "@/data/dashboard";
import type { ActivityItem } from "@/types";

const icons: Record<ActivityItem["type"], { icon: LucideIcon; className: string }> = {
  student: { icon: UserPlus, className: "bg-indigo-50 text-indigo-600" },
  question: { icon: FileQuestion, className: "bg-blue-50 text-blue-600" },
  test: { icon: ClipboardList, className: "bg-violet-50 text-violet-600" },
  payment: { icon: IndianRupee, className: "bg-emerald-50 text-emerald-600" },
  system: { icon: Server, className: "bg-slate-100 text-slate-600" },
};

export function ActivityFeed() {
  return (
    <Card className="h-full">
      <CardHeader title="Recent activities" description="What happened on the platform lately" />
      <ol className="px-5 pb-5 pt-4">
        {recentActivities.map((activity, index) => {
          const { icon: Icon, className } = icons[activity.type];
          const last = index === recentActivities.length - 1;
          return (
            <li key={activity.id} className="relative flex gap-3 pb-5 last:pb-0">
              {!last ? <span aria-hidden="true" className="absolute left-4 top-9 h-[calc(100%-2rem)] w-px bg-slate-200" /> : null}
              <span className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${className}`}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-sm text-slate-800">{activity.text}</p>
                <p className="mt-0.5 text-xs text-slate-400">{activity.time}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
