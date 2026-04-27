import type { APIRoute } from "astro";
import { z } from "@/lib/zodPl";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { Prisma } from "generated/prisma/client";
import { requiredPhoneSchema, sanitizePhone, toTitleCase } from "@/lib/validateInputs";

function isNotFound(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "P2025";
}

const UpdateCoachSchema = z
  .object({
    firstName: z.string().min(1, "Imię jest wymagane"),
    lastName: z.string().min(1, "Nazwisko jest wymagane"),
    email: z.union([z.string().email("Nieprawidłowy adres e-mail"), z.literal(""), z.null()]).optional(),
    phone: z
      .string()
      .transform((v) => sanitizePhone(v))
      .pipe(requiredPhoneSchema),
  })
  .transform((payload) => ({
    firstName: toTitleCase(payload.firstName),
    lastName: toTitleCase(payload.lastName),
    email: payload.email === undefined ? undefined : payload.email?.trim() || null,
    phone: payload.phone,
  }));

export const PATCH: APIRoute = async ({ params, request }) => {
  const id = params?.id;
  if (!id) {
    return json({ error: "Nieprawidłowe ID" }, 400);
  }

  const body = await request.json().catch(() => null);
  const parsed = UpdateCoachSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  try {
    const updated = await prisma.coach.update({
      where: { id },
      data: parsed.data,
    });
    return json(updated);
  } catch (error) {
    if (isNotFound(error)) return json({ error: "Nie znaleziono trenera" }, 404);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          const target = error.meta?.target as string[] | undefined;
          if (target?.includes("phone")) {
            return json({ error: "Trener już istnieje (numer telefonu jest zajęty)" }, 409);
          }
          if (target?.includes("email")) {
            return json({ error: "Trener już istnieje (adres e-mail jest zajęty)" }, 409);
          }
          return json({ error: "Trener już istnieje" }, 409);
        }
      }
    }
    throw error;
  }
};
