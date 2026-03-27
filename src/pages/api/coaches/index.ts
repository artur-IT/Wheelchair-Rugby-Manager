import type { APIRoute } from "astro";
import { z } from "@/lib/zodPl";
import { json } from "@/lib/api";
import { createCoach } from "@/lib/coaches";
import { toTitleCase } from "@/lib/validateInputs";

const CreateCoachSchema = z
  .object({
    firstName: z.string().min(1, "Imię jest wymagane"),
    lastName: z.string().min(1, "Nazwisko jest wymagane"),
    email: z.union([z.string().email("Nieprawidłowy email"), z.literal(""), z.null()]).optional(),
    phone: z.union([z.string(), z.null()]).optional(),
    seasonId: z.string().min(1, "Id sezonu jest wymagane"),
  })
  .transform((o) => ({
    firstName: toTitleCase(o.firstName),
    lastName: toTitleCase(o.lastName),
    email: ((typeof o.email === "string" ? o.email : "")?.trim() || undefined) as string | undefined,
    phone: ((typeof o.phone === "string" ? o.phone : "")?.trim() || undefined) as string | undefined,
    seasonId: o.seasonId,
  }));

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  const parsed = CreateCoachSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  const coach = await createCoach(parsed.data);
  return json(coach, 201);
};
