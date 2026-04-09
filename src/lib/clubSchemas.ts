import { z } from "@/lib/zodPl";
import { LOOSE_URL_REGEX, POSTAL_CODE_REGEX, toTitleCase } from "@/lib/validateInputs";

const DATA_IMAGE_URL_REGEX = /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/i;
const MAX_LOGO_DATA_URL_LENGTH = 3_000_000;

const optionalUrlSchema = z
  .union([z.literal(""), z.string().regex(LOOSE_URL_REGEX, "Nieprawidłowy adres URL")])
  .optional();

const optionalLogoSchema = z
  .union([
    z.literal(""),
    z
      .string()
      .refine(
        (v) => LOOSE_URL_REGEX.test(v) || DATA_IMAGE_URL_REGEX.test(v),
        "Nieprawidłowe logo. Dozwolone: URL http(s) albo data:image/png|jpeg|jpg|webp"
      )
      .refine((v) => !v.startsWith("data:image/") || v.length <= MAX_LOGO_DATA_URL_LENGTH, "Logo jest za duże"),
  ])
  .optional();

const optionalPostalCodeSchema = z
  .union([z.literal(""), z.string().regex(POSTAL_CODE_REGEX, "Kod pocztowy musi być w formacie XX-XXX")])
  .optional();

const optionalTitleCaseOrNull = (value: string | undefined): string | null | undefined => {
  if (value === undefined) return undefined;
  return value.trim() ? toTitleCase(value) : null;
};

const optionalTrimmedOrNull = (value: string | undefined): string | null | undefined => {
  if (value === undefined) return undefined;
  return value.trim() || null;
};

export const ClubUpsertSchema = z
  .object({
    ownerUserId: z.string().min(1, "Id użytkownika jest wymagane"),
    name: z.string().min(1, "Nazwa klubu jest wymagana"),
    contactAddress: z.string().optional(),
    contactCity: z.string().optional(),
    contactPostalCode: optionalPostalCodeSchema,
    contactEmail: z.union([z.literal(""), z.string().email("Nieprawidłowy email")]).optional(),
    contactPhone: z.string().optional(),
    websiteUrl: optionalUrlSchema,
    logoUrl: optionalLogoSchema,
    contactFirstName: z.string().optional(),
    contactLastName: z.string().optional(),
    hallName: z.string().optional(),
    hallAddress: z.string().optional(),
    hallCity: z.string().optional(),
    hallPostalCode: optionalPostalCodeSchema,
    hallMapUrl: optionalUrlSchema,
  })
  .transform((o) => ({
    ownerUserId: o.ownerUserId,
    name: toTitleCase(o.name),
    contactAddress: optionalTitleCaseOrNull(o.contactAddress),
    contactCity: optionalTitleCaseOrNull(o.contactCity),
    contactPostalCode: optionalTrimmedOrNull(o.contactPostalCode),
    contactEmail: optionalTrimmedOrNull(o.contactEmail),
    contactPhone: optionalTrimmedOrNull(o.contactPhone),
    websiteUrl: optionalTrimmedOrNull(o.websiteUrl),
    logoUrl: optionalTrimmedOrNull(o.logoUrl),
    contactFirstName: optionalTitleCaseOrNull(o.contactFirstName),
    contactLastName: optionalTitleCaseOrNull(o.contactLastName),
    hallName: optionalTitleCaseOrNull(o.hallName),
    hallAddress: optionalTitleCaseOrNull(o.hallAddress),
    hallCity: optionalTitleCaseOrNull(o.hallCity),
    hallPostalCode: optionalTrimmedOrNull(o.hallPostalCode),
    hallMapUrl: optionalTrimmedOrNull(o.hallMapUrl),
  }));

export const ClubTeamSchema = z
  .object({
    clubId: z.string().min(1, "Id klubu jest wymagane"),
    name: z.string().min(1, "Nazwa drużyny jest wymagana"),
    formula: z.enum(["WR4", "WR5"]),
    coachId: z.string().optional(),
    playerIds: z.array(z.string().min(1)).optional(),
  })
  .transform((o) => ({
    clubId: o.clubId,
    name: toTitleCase(o.name),
    formula: o.formula,
    coachId: o.coachId?.trim() || null,
    playerIds: o.playerIds ?? [],
  }));

export const ClubPlayerSchema = z
  .object({
    clubId: z.string().min(1, "Id klubu jest wymagane"),
    firstName: z.string().min(1, "Imię jest wymagane"),
    lastName: z.string().min(1, "Nazwisko jest wymagane"),
    classification: z.number().min(0).max(3.5).optional(),
    number: z.number().int().min(1).max(99).optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "GUEST"]).default("ACTIVE"),
    birthDate: z.string().datetime().optional(),
    contactEmail: z.union([z.literal(""), z.string().email("Nieprawidłowy email")]).optional(),
    contactPhone: z.string().optional(),
    contactAddress: z.string().optional(),
    contactCity: z.string().optional(),
    contactPostalCode: optionalPostalCodeSchema,
    contactMapUrl: optionalUrlSchema,
    playerFunction: z.enum(["DEFENSE", "ATTACK"]).optional(),
    speed: z.number().int().min(1).max(5).optional(),
    strength: z.number().int().min(1).max(5).optional(),
    endurance: z.number().int().min(1).max(5).optional(),
    technique: z.number().int().min(1).max(5).optional(),
    mentality: z.number().int().min(1).max(5).optional(),
    height: z.number().int().min(1).max(5).optional(),
    tactics: z.number().int().min(1).max(5).optional(),
  })
  .transform((o) => ({
    ...o,
    firstName: toTitleCase(o.firstName),
    lastName: toTitleCase(o.lastName),
    birthDate: o.birthDate ? new Date(o.birthDate) : null,
    contactEmail: o.contactEmail?.trim() || null,
    contactPhone: o.contactPhone?.trim() || null,
    contactAddress: o.contactAddress ? toTitleCase(o.contactAddress) : null,
    contactCity: o.contactCity ? toTitleCase(o.contactCity) : null,
    contactPostalCode: o.contactPostalCode?.trim() || null,
    contactMapUrl: o.contactMapUrl?.trim() || null,
  }));

export const ClubPersonSchema = z
  .object({
    clubId: z.string().min(1, "Id klubu jest wymagane"),
    firstName: z.string().min(1, "Imię jest wymagane"),
    lastName: z.string().min(1, "Nazwisko jest wymagane"),
    email: z.union([z.literal(""), z.string().email("Nieprawidłowy email")]).optional(),
    phone: z.string().optional(),
  })
  .transform((o) => ({
    clubId: o.clubId,
    firstName: toTitleCase(o.firstName),
    lastName: toTitleCase(o.lastName),
    email: o.email?.trim() || null,
    phone: o.phone?.trim() || null,
  }));
