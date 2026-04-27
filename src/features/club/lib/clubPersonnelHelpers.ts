import { differenceInYears, parseISO } from "date-fns";
import { buildGoogleMapsSearchUrl } from "@/lib/addressDisplay";
import type { FieldError, FieldErrors, FieldValues, Resolver } from "react-hook-form";
import type { ZodError } from "zod";

interface ApiValidationErrorShape {
  formErrors?: unknown;
  fieldErrors?: Record<string, unknown>;
}

const CLUB_PLAYER_FIELD_LABELS: Record<string, string> = {
  firstName: "Imię",
  lastName: "Nazwisko",
  classification: "Klasyfikacja",
  number: "Numer koszulki",
  status: "Status",
  birthDate: "Data urodzenia",
  contactEmail: "E-mail kontaktowy",
  contactPhone: "Telefon kontaktowy",
  contactAddress: "Ulica",
  contactCity: "Miasto",
  contactPostalCode: "Kod pocztowy",
  contactMapUrl: "Link do mapy",
  speed: "Szybkość",
  strength: "Siła",
  endurance: "Wytrzymałość",
  technique: "Technika",
  mentality: "Mentalność",
  tactics: "Taktyka",
};

const CLUB_PLAYER_SKILL_API_KEYS = new Set([
  "speed",
  "strength",
  "endurance",
  "technique",
  "mentality",
  "tactics",
]);

/** API sometimes returns Zod’s generic "Nieprawidłowa wartość" — map to a concrete hint per field. */
export function resolveClubPlayerFieldErrorMessage(fieldKey: string, rawMessage: string): string {
  if (rawMessage !== "Nieprawidłowa wartość") return rawMessage;
  if (CLUB_PLAYER_SKILL_API_KEYS.has(fieldKey)) {
    return "Wybierz ocenę od 1 do 5 albo pozostaw puste (—).";
  }
  switch (fieldKey) {
    case "contactPostalCode":
      return "Podaj kod w formacie XX-XXX albo zostaw pole puste.";
    case "contactPhone":
      return "Podaj dokładnie 9 cyfr (bez +48) albo zostaw pole puste.";
    case "contactEmail":
      return "Podaj poprawny adres e-mail albo zostaw pole puste.";
    case "number":
      return "Podaj numer od 1 do 99 albo „-”, jeśli zawodnik nie ma numeru.";
    case "birthDate":
      return "Podaj datę w formacie RRRR-MM-DD albo zostaw puste.";
    default:
      return "To pole ma nieprawidłową wartość — sprawdź wpis.";
  }
}

/** Multi-line summary for the dialog Alert (use with white-space: pre-line). */
export function buildClubPlayerValidationBanner(fieldMessages: Record<string, string>): string {
  const entries = Object.entries(fieldMessages);
  if (entries.length === 0) return "Nie udało się zapisać danych.";
  if (entries.length === 1) {
    const [key, msg] = entries[0]!;
    const label = CLUB_PLAYER_FIELD_LABELS[key] ?? key;
    return `${label}: ${msg}`;
  }
  const lines = entries.map(([key, msg]) => {
    const label = CLUB_PLAYER_FIELD_LABELS[key] ?? key;
    return `• ${label}: ${msg}`;
  });
  return `Nie udało się zapisać danych. Popraw:\n${lines.join("\n")}`;
}

export class ClubPersonnelValidationError extends Error {
  readonly fieldMessages: Record<string, string>;
  constructor(fieldMessages: Record<string, string>) {
    super(buildClubPlayerValidationBanner(fieldMessages));
    this.name = "ClubPersonnelValidationError";
    this.fieldMessages = fieldMessages;
  }
}

/** All API field errors with readable messages (for setError + banner). */
export function parseClubPlayerApiFieldMessages(data: unknown): Record<string, string> | null {
  if (!data || typeof data !== "object") return null;
  const errorValue = (data as { error?: unknown }).error;
  if (!errorValue || typeof errorValue !== "object") return null;
  const validation = errorValue as ApiValidationErrorShape;
  if (!validation.fieldErrors || typeof validation.fieldErrors !== "object") return null;

  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(validation.fieldErrors)) {
    const msgs = Array.isArray(raw) ? raw.filter((v): v is string => typeof v === "string") : [];
    const msg = msgs[0];
    if (!msg) continue;
    out[key] = resolveClubPlayerFieldErrorMessage(key, msg);
  }
  return Object.keys(out).length > 0 ? out : null;
}

/** First readable message from API error JSON (string or Zod flatten). Prefixes field keys with Polish labels. */
export function extractClubApiErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const errorValue = (data as { error?: unknown }).error;
  if (typeof errorValue === "string" && errorValue.trim().length > 0) return errorValue;

  if (errorValue && typeof errorValue === "object") {
    const validation = errorValue as ApiValidationErrorShape;
    const formErrors = Array.isArray(validation.formErrors)
      ? validation.formErrors.filter((e): e is string => typeof e === "string")
      : [];
    if (formErrors[0]) return formErrors[0];

    if (validation.fieldErrors && typeof validation.fieldErrors === "object") {
      const allResolved: Record<string, string> = {};
      for (const [key, raw] of Object.entries(validation.fieldErrors)) {
        const msgs = Array.isArray(raw) ? raw.filter((v): v is string => typeof v === "string") : [];
        const msg = msgs[0];
        if (!msg) continue;
        allResolved[key] = resolveClubPlayerFieldErrorMessage(key, msg);
      }
      const keys = Object.keys(allResolved);
      if (keys.length === 1) {
        const key = keys[0]!;
        const label = CLUB_PLAYER_FIELD_LABELS[key] ?? key;
        return `${label}: ${allResolved[key]}`;
      }
      if (keys.length > 1) {
        return buildClubPlayerValidationBanner(allResolved);
      }
    }
  }

  return fallback;
}

/** Google Maps search URL from street + postal + city (same pattern as tournament hall / hotel). */
export function buildContactMapSearchUrl(parts: {
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
}): string | null {
  const street = parts.address?.trim() ?? "";
  const postal = parts.postalCode?.trim() ?? "";
  const city = parts.city?.trim() ?? "";
  const cityLine = [postal, city].filter(Boolean).join(" ").trim();
  const fullAddress = [street, cityLine].filter(Boolean).join(", ");
  return buildGoogleMapsSearchUrl({ name: "", address: fullAddress || undefined });
}

/** Age in full years from ISO date string (e.g. API JSON); null if invalid / missing. */
export function computeAgeFromIsoDateString(
  isoDate: string | null | undefined,
  referenceDate = new Date()
): number | null {
  if (!isoDate?.trim()) return null;
  try {
    const d = parseISO(isoDate);
    if (Number.isNaN(d.getTime())) return null;
    return differenceInYears(referenceDate, d);
  } catch {
    return null;
  }
}

/** Display "-" for empty optional last name. */
export function displayOptionalLastName(lastName: string | null | undefined): string {
  return lastName?.trim() ? lastName : "—";
}

export interface ClubPersonnelZodSchema {
  safeParse: (data: unknown) => { success: true; data: unknown } | { success: false; error: ZodError };
}

/** Validates with Zod but keeps raw RHF values (output transforms do not replace the form). */
export function zodSafeParseResolver<TValues extends FieldValues>(schema: ClubPersonnelZodSchema): Resolver<TValues> {
  return async (values) => {
    const result = schema.safeParse(values);
    if (result.success) {
      return { values, errors: {} };
    }
    const flat = (result as { success: false; error: ZodError }).error.flatten().fieldErrors;
    const errors: FieldErrors<TValues> = {};
    for (const key of Object.keys(flat)) {
      const msg = flat[key as keyof typeof flat]?.[0];
      if (msg && typeof msg === "string") {
        (errors as Record<string, FieldError | undefined>)[key] = { type: "validate", message: msg };
      }
    }
    return { values: {} as never, errors };
  };
}

/** Jersey number for form: null from API → "-" */
export function playerNumberToFormValue(n: number | null | undefined): string {
  return n === null || n === undefined ? "-" : String(n);
}
