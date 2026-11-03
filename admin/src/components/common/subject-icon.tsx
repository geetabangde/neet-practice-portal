import {
  Activity,
  Baby,
  Bone,
  Brain,
  Dna,
  Droplets,
  Ear,
  Eye,
  FlaskConical,
  Heart,
  Microscope,
  Pill,
  Scan,
  Smile,
  Stethoscope,
  Syringe,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { SubjectIconKey } from "@/types";

export const subjectIcons: Record<SubjectIconKey, LucideIcon> = {
  bone: Bone,
  activity: Activity,
  microscope: Microscope,
  heart: Heart,
  eye: Eye,
  syringe: Syringe,
  brain: Brain,
  flask: FlaskConical,
  pill: Pill,
  dna: Dna,
  baby: Baby,
  droplets: Droplets,
  ear: Ear,
  scan: Scan,
  smile: Smile,
  stethoscope: Stethoscope,
};

export const subjectIconKeys = Object.keys(subjectIcons) as SubjectIconKey[];

const sizes = { sm: "h-9 w-9", md: "h-11 w-11", lg: "h-14 w-14" };
const iconSizes = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-7 w-7" };

// A subject's icon inside a soft coloured square
export function SubjectIcon({
  icon,
  size = "md",
  className,
}: {
  icon: SubjectIconKey;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const Icon = subjectIcons[icon];
  return (
    <span
      className={cn("flex shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600", sizes[size], className)}
    >
      <Icon className={iconSizes[size]} aria-hidden="true" />
    </span>
  );
}
