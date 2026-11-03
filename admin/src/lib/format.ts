const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-10-30" -> "30 Oct 2026". It reads the text, so every time zone shows the same day.
export function formatDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  return `${String(day).padStart(2, "0")} ${MONTHS[month - 1]} ${year}`;
}

// "2026-10-30T14:05" -> "30 Oct 2026, 2:05 PM"
export function formatDateTime(iso: string): string {
  const [date, time = "00:00"] = iso.split("T");
  const [hour, minute] = time.split(":").map(Number);
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${formatDate(date)}, ${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

const rupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number): string {
  return rupees.format(amount);
}

const indian = new Intl.NumberFormat("en-IN");

// 124500 -> "1,24,500"
export function formatNumber(value: number): string {
  return indian.format(value);
}

// 1250000 -> "12.5L", 48000 -> "48K"
export function formatCompact(value: number): string {
  if (value >= 10_000_000) return `${trim(value / 10_000_000)}Cr`;
  if (value >= 100_000) return `${trim(value / 100_000)}L`;
  if (value >= 1_000) return `${trim(value / 1_000)}K`;
  return String(value);
}

function trim(n: number): string {
  return n.toFixed(1).replace(/\.0$/, "");
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

// Text such as "Single correct" from a value such as "single-correct"
export function sentenceCase(text: string): string {
  const spaced = text.replace(/[-_]/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
