import { z } from "@/lib/zodPl";

/** ASCII letters + digits only; canonical lowercase applied after parse. */
const localLoginPattern = /^[a-zA-Z0-9]{1,6}$/;

export const LocalLoginSchema = z
  .string()
  .trim()
  .regex(localLoginPattern, "Nick: tylko litery (A–Z, a–z) i cyfry, 1–6 znaków, bez polskich znaków.")
  .transform((s) => s.toLowerCase());

export const RegisterBodySchema = z.object({
  localLogin: LocalLoginSchema,
  password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków").max(128),
  email: z.string().trim().toLowerCase().email(),
  /** Optional display name; empty string is treated as omitted in the API. */
  name: z
    .string()
    .trim()
    .max(60)
    .transform((s) => (s === "" ? undefined : s))
    .optional(),
});

export const LoginBodySchema = z.object({
  localLogin: LocalLoginSchema,
  password: z.string().min(1).max(16, "Hasło musi mieć co najwyżej 16 znaków"),
});

/** First-time password for migrated LOCAL users (no hash yet). */
export const InitialLocalPasswordBodySchema = z.object({
  localLogin: LocalLoginSchema,
  password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków").max(128),
});

/** Logged-in user clearing `mustResetPassword` after mandatory reset. */
export const CompletePasswordResetBodySchema = z.object({
  password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków").max(128),
});
