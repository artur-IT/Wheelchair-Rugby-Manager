import type { APIRoute } from "astro";
import { z } from "zod";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";

function isNotFound(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "P2025";
}

const UpdatePersonSchema = z
  .object({
    firstName: z.string().min(1, "Imię jest wymagane"),
    lastName: z.string().min(1, "Nazwisko jest wymagane"),
    email: z.union([z.string().email("Nieprawidłowy email"), z.literal(""), z.null()]).optional(),
    phone: z.string().nullable().optional(),
  })
  .transform((payload) => ({
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
    // undefined = field absent → Prisma skips; null/"" = explicit clear → Prisma sets NULL
    email: payload.email === undefined ? undefined : payload.email?.trim() || null,
    phone: payload.phone === undefined ? undefined : payload.phone?.trim() || null,
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
    const updated = await prisma.referee.update({
      where: { id },
      data: parsed.data,
    });
    return json(updated);
  } catch (error) {
    if (isNotFound(error)) return json({ error: "Nie znaleziono sędziego" }, 404);
    throw error;
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = params?.id;
  if (!id) {
    return json({ error: "Nieprawidłowe ID" }, 400);
  }

  try {
    await prisma.referee.delete({
      where: { id },
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    if (isNotFound(error)) return json({ error: "Nie znaleziono sędziego" }, 404);
    throw error;
  }
};
