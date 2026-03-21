/**
 * Parses API JSON error bodies: plain string, Zod flatten, or nested formErrors.
 */
export function parseApiErrorBody(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.error === "string") return o.error;
  if (o.error && typeof o.error === "object") {
    const e = o.error as Record<string, unknown>;
    const formErrors = e.formErrors;
    if (Array.isArray(formErrors) && typeof formErrors[0] === "string") return formErrors[0];
    const fieldErrors = e.fieldErrors;
    if (fieldErrors && typeof fieldErrors === "object") {
      const firstList = Object.values(fieldErrors as Record<string, string[] | undefined>).find(
        (arr) => Array.isArray(arr) && arr.length
      );
      if (firstList?.[0]) return firstList[0];
    }
  }
  return null;
}

/** User-facing message when the response body has no parseable error. */
export function httpStatusFallbackMessage(res: Response): string {
  if (res.status >= 500) return "Serwer jest chwilowo niedostępny. Spróbuj ponownie za chwilę.";
  if (res.status === 401) return "Musisz się zalogować.";
  if (res.status === 403) return "Brak uprawnień do tej operacji.";
  if (res.status === 404) return "Nie znaleziono zasobu.";
  return `Żądanie nie powiodło się (${res.status}).`;
}

/** Reads JSON from a non-OK response and returns the best error string, else status-based fallback. */
export async function getErrorMessageFromResponse(res: Response, fallback: string): Promise<string> {
  const raw = await res.json().catch(() => null);
  return parseApiErrorBody(raw) ?? httpStatusFallbackMessage(res) ?? fallback;
}
