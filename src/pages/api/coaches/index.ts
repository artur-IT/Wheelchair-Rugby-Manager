import type { APIRoute } from "astro";
import { z } from "@/lib/zodPl";
import { json } from "@/lib/api";
import { createCoach } from "@/lib/coaches";
import { Prisma } from "generated/prisma/client";
import { requiredPhoneSchema, sanitizePhone, toTitleCase } from "@/lib/validateInputs";

const CreateCoachSchema = z
  .object({
    firstName: z.string().min(1, "Imię jest wymagane"),
    lastName: z.string().min(1, "Nazwisko jest wymagane"),
    email: z.union([z.string().email("Nieprawidłowy email"), z.literal(""), z.null()]).optional(),
    phone: z
      .string()
      .transform((v) => sanitizePhone(v))
      .pipe(requiredPhoneSchema),
    seasonId: z.string().min(1, "Id sezonu jest wymagane"),
  })
  .transform((o) => ({
    firstName: toTitleCase(o.firstName),
    lastName: toTitleCase(o.lastName),
    email: ((typeof o.email === "string" ? o.email : "")?.trim() || undefined) as string | undefined,
    phone: o.phone,
    seasonId: o.seasonId,
  }));

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  const parsed = CreateCoachSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  try {
    const coach = await createCoach(parsed.data);
    return json(coach, 201);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return json({ error: "Trener już istnieje (numer telefonu jest zajęty)" }, 409);
      }
      if (error.code === "P2003") {
        return json({ error: "Nieprawidłowy identyfikator sezonu" }, 400);
      }
    }
    return json({ error: "Nie udało się utworzyć trenera" }, 500);
  }
};
