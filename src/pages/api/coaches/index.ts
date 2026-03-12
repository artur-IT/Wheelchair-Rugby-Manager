import type { APIRoute } from "astro";
import { z } from "zod";
import { json } from "@/lib/api";
import { createCoach } from "@/lib/coaches";

const CreateCoachSchema = z
  .object({
    firstName: z.string().min(1, "Imię jest wymagane"),
    lastName: z.string().min(1, "Nazwisko jest wymagane"),
    email: z.union([z.string().email("Nieprawidłowy email"), z.literal("")]).optional(),
    phone: z.string().optional(),
    seasonId: z.string().min(1, "SeasonId jest wymagany"),
  })
  .transform((o) => ({
    firstName: o.firstName.trim(),
    lastName: o.lastName.trim(),
    email: (o.email?.trim() || undefined) as string | undefined,
    phone: (o.phone?.trim() || undefined) as string | undefined,
    seasonId: o.seasonId,
  }));

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  const parsed = CreateCoachSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  const coach = await createCoach(parsed.data);
  return json(coach, 201);
};
