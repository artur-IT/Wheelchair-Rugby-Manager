import { z } from "zod/v4";

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

export const requiredSeasonNameSchema = z
  .string()
  .min(1, "Nazwa sezonu jest wymagana")
  .max(MAX_LONG_TEXT, `Nazwa sezonu nie może przekraczać ${MAX_LONG_TEXT} znaków`);

/** Optional website URL: accepts empty string or a valid URL up to 150 characters. */
export const optionalWebsiteUrlSchema = z
  .string()
  .url("Nieprawidłowy adres URL")
  .max(MAX_LONG_TEXT, `URL nie może przekraczać ${MAX_LONG_TEXT} znaków`)
  .optional()
  .or(z.literal(""));
