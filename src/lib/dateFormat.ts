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
