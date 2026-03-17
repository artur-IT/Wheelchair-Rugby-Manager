import { z } from "zod/v4";

// ─── Text normalisation ────────────────────────────────────────────────────────

/** Capitalises the first letter of every word; lowercases the rest. Handles Polish characters. */
export function toTitleCase(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// ─── Phone fields ──────────────────────────────────────────────────────────────

/** Strips non-digits and limits to 9 characters as the user types. */
export function sanitizePhone(value: string): string {
  return value.replace(/\D/g, "").slice(0, 9);
}

/** Optional phone: accepts empty string or exactly 9 digits. */
export const optionalPhoneSchema = z
  .string()
  .refine((v) => !v || v.length === 9, { message: "Numer telefonu musi zawierać dokładnie 9 cyfr" })
  .optional();

/** Required phone: must be exactly 9 digits. */
export const requiredPhoneSchema = z
  .string()
  .min(1, "Telefon jest wymagany")
  .length(9, "Numer telefonu musi zawierać dokładnie 9 cyfr");

// ─── Person fields (firstName, lastName, email) — max 50 chars ────────────────

export const MAX_SHORT_TEXT = 50;

export const requiredFirstNameSchema = z
  .string()
  .min(1, "Imię jest wymagane")
  .max(MAX_SHORT_TEXT, `Imię nie może przekraczać ${MAX_SHORT_TEXT} znaków`);

export const requiredLastNameSchema = z
  .string()
  .min(1, "Nazwisko jest wymagane")
  .max(MAX_SHORT_TEXT, `Nazwisko nie może przekraczać ${MAX_SHORT_TEXT} znaków`);

export const requiredEmailSchema = z
  .string()
  .email("Nieprawidłowy adres email")
  .max(MAX_SHORT_TEXT, `Email nie może przekraczać ${MAX_SHORT_TEXT} znaków`);

/** Optional first name: accepts empty string or up to 50 characters. */
export const optionalFirstNameSchema = z
  .string()
  .max(MAX_SHORT_TEXT, `Imię nie może przekraczać ${MAX_SHORT_TEXT} znaków`)
  .optional();

/** Optional last name: accepts empty string or up to 50 characters. */
export const optionalLastNameSchema = z
  .string()
  .max(MAX_SHORT_TEXT, `Nazwisko nie może przekraczać ${MAX_SHORT_TEXT} znaków`)
  .optional();

/** Optional email: accepts empty string or a valid email up to 50 characters. */
export const optionalEmailSchema = z
  .union([
    z.string().email("Nieprawidłowy email").max(MAX_SHORT_TEXT, `Email nie może przekraczać ${MAX_SHORT_TEXT} znaków`),
    z.literal(""),
  ])
  .optional();

// ─── Long text fields (team name, address, website URL, season name) — max 150 chars ──

export const MAX_LONG_TEXT = 150;

export const requiredTeamNameSchema = z
  .string()
  .min(1, "Nazwa drużyny jest wymagana")
  .max(MAX_LONG_TEXT, `Nazwa drużyny nie może przekraczać ${MAX_LONG_TEXT} znaków`);

export const requiredAddressSchema = z
  .string()
  .min(1, "Adres jest wymagany")
  .max(MAX_LONG_TEXT, `Adres nie może przekraczać ${MAX_LONG_TEXT} znaków`);

export const requiredCitySchema = z
  .string()
  .min(1, "Miasto jest wymagane")
  .max(MAX_LONG_TEXT, `Miasto nie może przekraczać ${MAX_LONG_TEXT} znaków`);

/** Polish postal code: XX-XXX */
export const POSTAL_CODE_REGEX = /^\d{2}-\d{3}$/;

export const requiredPostalCodeSchema = z
  .string()
  .min(1, "Kod pocztowy jest wymagany")
  .regex(POSTAL_CODE_REGEX, "Kod pocztowy musi być w formacie XX-XXX");

export const requiredSeasonNameSchema = z
  .string()
  .min(1, "Nazwa sezonu jest wymagana")
  .max(MAX_LONG_TEXT, `Nazwa sezonu nie może przekraczać ${MAX_LONG_TEXT} znaków`);

// ─── Player fields (classification, number) ───────────────────────────────────

/** Player classification: 0.5–3.5 in steps of 0.5. */
export const playerClassificationSchema = z
  .number()
  .min(0.5, "Klasyfikacja: 0.5–3.5")
  .max(3.5, "Klasyfikacja: 0.5–3.5")
  .refine((v) => v % 0.5 === 0, "Klasyfikacja: 0.5–3.5");

/** Player jersey number: integer 1–99. */
export const playerNumberSchema = z
  .number()
  .int("Numer musi być liczbą całkowitą")
  .min(1, "Numer: 1–99")
  .max(99, "Numer: 1–99");

// WebUrl validation

// Accepts urls with or without protocol: "wp.pl", "www.wp.pl", "https://wp.pl"
export const LOOSE_URL_REGEX = /^(https?:\/\/)?([\w-]+\.)+[\w]{2,}(\/\S*)?$/;

/** Optional website URL: accepts empty string or a domain/URL up to 150 characters. */
export const optionalWebsiteUrlSchema = z
  .union([
    z.literal(""),
    z
      .string()
      .max(MAX_LONG_TEXT, `URL nie może przekraczać ${MAX_LONG_TEXT} znaków`)
      .refine((v) => LOOSE_URL_REGEX.test(v), "Nieprawidłowy adres URL"),
  ])
  .optional();
