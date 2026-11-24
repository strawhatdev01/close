export function naira(n: number): string {
  const rounded = Math.round(n);
  const formatted = Math.abs(rounded).toLocaleString("en-NG");
  return rounded < 0 ? `−₦${formatted}` : `₦${formatted}`;
}

export function parseNaira(raw: string): number | null {
  const trimmed = raw.replace(/[₦,\s]/g, "");
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

export function shortageOf(amountDue: number, returned: number): number {
  return Math.max(0, amountDue - returned);
}
