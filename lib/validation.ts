// Shared form checks, used by the trial form and the login / signup pages

// 10 digits, optionally prefixed with 91 or +91; spaces and dashes are ignored
export function isValidMobile(value: string): boolean {
  return /^(\+?91)?\d{10}$/.test(value.replace(/[\s-]/g, ""));
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
