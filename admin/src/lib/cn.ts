type ClassValue = string | false | null | undefined;

// Joins class names and skips the empty ones: cn("a", isOn && "b") -> "a b" or "a"
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
