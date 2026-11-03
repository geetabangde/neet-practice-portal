import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

const palette = [
  "bg-indigo-100 text-indigo-700",
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-xl",
  xl: "h-24 w-24 text-3xl",
};

interface AvatarProps {
  name: string;
  size?: keyof typeof sizes;
  className?: string;
}

// A round badge with the person's initials. The colour is picked from the name,
// so the same person always gets the same colour.
export function Avatar({ name, size = "md", className }: AvatarProps) {
  const colour = palette[[...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % palette.length];
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        colour,
        sizes[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
