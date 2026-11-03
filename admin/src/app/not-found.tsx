import { Compass } from "lucide-react";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        <Compass className="h-7 w-7" aria-hidden="true" />
      </span>
      <p className="mt-6 text-sm font-semibold text-indigo-600">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        The page you are looking for does not exist, or the item was deleted.
      </p>
      <Link href="/dashboard" className={buttonStyles({ className: "mt-6" })}>
        Back to dashboard
      </Link>
    </div>
  );
}
