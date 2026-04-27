import type { APIRoute } from "astro";
import { z } from "@/lib/zodPl";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { Prisma } from "generated/prisma/client";
import { requiredPhoneSchema, sanitizePhone, toTitleCase } from "@/lib/validateInputs";

function isNotFound(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "P2025";
}

const UpdatePersonSchema = z
  .object({
    firstName: z.string().trim().min(1, "Imię jest wymagane"),
    lastName: z.string().trim().min(1, "Nazwisko jest wymagane"),
    email: z.union([z.string().email("Nieprawidłowy adres e-mail"), z.literal(""), z.null()]).optional(),
    phone: z
      .string()
      .transform((v) => sanitizePhone(v))
      .pipe(requiredPhoneSchema),
  })
  .transform((payload) => ({
    firstName: toTitleCase(payload.firstName),
    lastName: toTitleCase(payload.lastName),
    // undefined = field absent → Prisma skips; null/"" = explicit clear → Prisma sets NULL
    email: payload.email === undefined ? undefined : payload.email?.trim() || null,
    phone: payload.phone,
  }));

export const PATCH: APIRoute = async ({ params, request }) => {
  const id = params?.id;
  if (!id) {
    return json({ error: "Nieprawidłowe ID" }, 400);
  }

  const body = await request.json().catch(() => null);
  const parsed = UpdatePersonSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  try {
    const updated = await prisma.classifier.update({
      where: { id },
      data: parsed.data,
    });
    return json(updated);
  } catch (error) {
    if (isNotFound(error)) return json({ error: "Nie znaleziono klasyfikatora" }, 404);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return json({ error: "Klasyfikator już istnieje (numer telefonu jest zajęty)" }, 409);
      }
    }
    throw error;
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = params?.id;
  if (!id) {
    return json({ error: "Nieprawidłowe ID" }, 400);
  }

  try {
    await prisma.classifier.delete({
      where: { id },
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    if (isNotFound(error)) return json({ error: "Nie znaleziono klasyfikatora" }, 404);
    throw error;
  }
};
