/**
 * Formats a date range for Polish locale.
 * Returns empty string when both dates are invalid.
 */
export function formatDateRangePl(start: string, end?: string): string {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;

  if (Number.isNaN(startDate.getTime())) {
    return end && !Number.isNaN(endDate?.getTime() ?? Number.NaN) ? (endDate?.toLocaleDateString("pl-PL") ?? "") : "";
  }

  if (!endDate || Number.isNaN(endDate.getTime())) {
    return startDate.toLocaleDateString("pl-PL");
  }

  return `${startDate.toLocaleDateString("pl-PL")} - ${endDate.toLocaleDateString("pl-PL")}`;
}
