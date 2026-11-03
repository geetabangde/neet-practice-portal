import {
  Bell,
  ChartLine,
  ClipboardCheck,
  ClipboardList,
  Crown,
  FileQuestion,
  Layers,
  LayoutDashboard,
  Settings,
  BookOpen,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

// The sidebar. To add a page to the menu, add a line here (and create the page under src/app/(admin)).
export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Content",
    items: [
      { label: "Students", href: "/students", icon: Users },
      { label: "Subjects", href: "/subjects", icon: BookOpen },
      { label: "Topics", href: "/topics", icon: Layers },
      { label: "Question Bank", href: "/questions", icon: FileQuestion },
      { label: "Test Management", href: "/tests", icon: ClipboardList },
    ],
  },
  {
    title: "Insights",
    items: [
      { label: "Test Results", href: "/results", icon: ClipboardCheck },
      { label: "Analytics", href: "/analytics", icon: ChartLine },
    ],
  },
  {
    title: "Business",
    items: [
      { label: "Subscription Plans", href: "/subscriptions", icon: Crown },
      { label: "Payments", href: "/payments", icon: Wallet },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Notifications", href: "/notifications", icon: Bell },
      { label: "Admin Settings", href: "/settings", icon: Settings },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

// The menu item that matches the current URL, e.g. "/questions/q-001/edit" -> "/questions"
export function activeNavHref(pathname: string): string | undefined {
  return NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.href;
}

export interface Crumb {
  label: string;
  // The last crumb (the page you are on) has no link
  href?: string;
}

// Breadcrumbs for a URL: "/questions/new" -> Home > Question Bank > Add Question
export function breadcrumbsFor(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  const root = NAV_ITEMS.find((item) => item.href === `/${segments[0]}`);
  const crumbs: Crumb[] = [{ label: "Home", href: "/dashboard" }];
  if (!root) return crumbs;

  const rest = segments.slice(1);
  crumbs.push({ label: root.label, href: rest.length > 0 ? root.href : undefined });

  const newLabel: Record<string, string> = { "/questions": "Add Question", "/tests": "Create Test" };
  const editLabel: Record<string, string> = { "/questions": "Edit Question", "/tests": "Edit Test" };
  const detailLabel: Record<string, string> = { "/students": "Student Details", "/results": "Result Details" };

  rest.forEach((segment, index) => {
    const isLast = index === rest.length - 1;
    const href = isLast ? undefined : root.href;
    if (segment === "new") {
      crumbs.push({ label: newLabel[root.href] ?? "New" });
    } else if (segment === "edit") {
      crumbs.push({ label: editLabel[root.href] ?? "Edit" });
    } else if (rest[index + 1] === "edit") {
      // An id in front of "edit" is not shown; the "edit" crumb says it all
    } else {
      crumbs.push({ label: detailLabel[root.href] ?? "Details", href });
    }
  });

  return crumbs;
}

export function pageTitleFor(pathname: string): string {
  const crumbs = breadcrumbsFor(pathname);
  return crumbs[crumbs.length - 1].label;
}
