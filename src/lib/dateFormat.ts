/** Local calendar date as `YYYY-MM-DD` (for HTML date input `min` / `max`). */
export function formatLocalIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Today's date in the local calendar as `YYYY-MM-DD`. */
export function todayLocalIsoDate(): string {
  return formatLocalIsoDate(new Date());
}

/**
 * Formats a date range for Polish locale.
 * Returns empty string when both dates are invalid.
 */
export function formatDateRangePl(start: string, end?: string): string {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;

  const formatter = new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const format = (d: Date) => formatter.format(d).replace(/\./g, "");

  if (Number.isNaN(startDate.getTime())) {
    return end && !Number.isNaN(endDate?.getTime() ?? Number.NaN) ? (endDate ? format(endDate) : "") : "";
  }

  if (!endDate || Number.isNaN(endDate.getTime())) {
    return format(startDate);
  }

  return `${format(startDate)} - ${format(endDate)}`;
}

/**
 * Formats a date range for Polish locale with long month name (e.g. "26 października 2026").
 * Returns empty string when both dates are invalid.
 */
export function formatDateRangePlLongMonth(start: string, end?: string): string {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;

  const formatter = new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const format = (d: Date) => formatter.format(d);

  if (Number.isNaN(startDate.getTime())) {
    return end && !Number.isNaN(endDate?.getTime() ?? Number.NaN) ? (endDate ? format(endDate) : "") : "";
  }

  if (!endDate || Number.isNaN(endDate.getTime())) {
    return format(startDate);
  }

  return `${format(startDate)} - ${format(endDate)}`;
}
