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

export class ApiValidationError extends Error {
  fieldErrors?: Record<string, string[] | undefined>;
  context?: string;
  constructor(message: string, fieldErrors?: Record<string, string[] | undefined>, context?: string) {
    super(message);
    this.name = "ApiValidationError";
    this.fieldErrors = fieldErrors;
    this.context = context;
  }
}

export function parseApiFieldErrors(raw: unknown): Record<string, string[] | undefined> | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!o.error || typeof o.error !== "object") return null;
  const e = o.error as Record<string, unknown>;
  const fieldErrors = e.fieldErrors;
  if (!fieldErrors || typeof fieldErrors !== "object") return null;
  return fieldErrors as Record<string, string[] | undefined>;
}

export function firstApiFieldErrorKey(fieldErrors: Record<string, string[] | undefined>): string | null {
  const entry = Object.entries(fieldErrors).find(([, errors]) => Array.isArray(errors) && errors.length > 0);
  return entry?.[0] ?? null;
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

/** Zod-style formErrors / fieldErrors from API validation responses. */
export async function parseFormErrorFromResponse(response: Response, fallback: string): Promise<string> {
  const errorBody = (await response.json().catch(() => null)) as {
    error?: { formErrors?: string[]; fieldErrors?: Record<string, string[] | undefined> };
  } | null;
  const fieldErrors = (errorBody?.error?.fieldErrors ?? {}) as Record<string, string[] | undefined>;
  const fieldMessages = Object.values(fieldErrors).reduce<string[]>((acc, errors) => {
    if (errors) acc.push(...errors);
    return acc;
  }, []);
  return errorBody?.error?.formErrors?.[0] ?? fieldMessages[0] ?? fallback;
}
