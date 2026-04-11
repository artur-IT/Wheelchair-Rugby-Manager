import {
  ClubCoachRefereeFieldsSchema,
  ClubPlayerFieldsSchema,
  ClubStaffFieldsSchema,
  ClubVolunteerFieldsSchema,
} from "@/lib/clubSchemas";
import { z } from "@/lib/zodPl";

/** Optional 1–5 rating in the form; empty string means not set (stored as null in DB). */
const skillRatingFromForm = z.preprocess(
  (v) => (v === null || v === undefined ? "" : v),
  z.union([
    z.literal(""),
    z.number().int().min(1, "Ocena od 1 do 5").max(5, "Ocena od 1 do 5"),
  ])
);

/**
 * Form validation aligned with API `ClubPlayerFieldsSchema` without `clubId` (added on submit).
 * Skills are always optional; `height` is omitted here because the player dialog does not collect it.
 */
export const clubPlayerFormSchema = ClubPlayerFieldsSchema.omit({ clubId: true, height: true }).extend({
  speed: skillRatingFromForm,
  strength: skillRatingFromForm,
  endurance: skillRatingFromForm,
  technique: skillRatingFromForm,
  mentality: skillRatingFromForm,
  tactics: skillRatingFromForm,
});

export const clubCoachFormSchema = ClubCoachRefereeFieldsSchema.omit({ clubId: true });

export const clubVolunteerFormSchema = ClubVolunteerFieldsSchema.omit({ clubId: true });

export const clubRefereeFormSchema = ClubCoachRefereeFieldsSchema.omit({ clubId: true });

export const clubStaffOtherFormSchema = ClubStaffFieldsSchema.omit({ clubId: true });

/** RHF player form shape (strings for inputs; validated by `clubPlayerFormSchema` on submit). */
export interface ClubPlayerFormValues {
  firstName: string;
  lastName: string;
  classification: number;
  number: string;
  status: "ACTIVE" | "INACTIVE" | "GUEST";
  birthDate: string | null;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  contactCity: string;
  contactPostalCode: string;
  contactMapUrl: string;
  /** Empty string = not rated (null in API). */
  speed: number | "";
  strength: number | "";
  endurance: number | "";
  technique: number | "";
  mentality: number | "";
  tactics: number | "";
}

/** Values kept as plain strings in RHF before Zod preprocess on submit. */
export interface ClubSimplePersonFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}
