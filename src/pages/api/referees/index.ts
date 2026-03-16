import type { APIRoute } from "astro";
import { z } from "zod";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { createReferee } from "@/lib/referees";

const CreateRefereeSchema = z
  .object({
    firstName: z.string().min(1, "Imię jest wymagane"),
    lastName: z.string().min(1, "Nazwisko jest wymagane"),
    email: z.union([z.string().email("Nieprawidłowy email"), z.literal(""), z.null()]).optional(),
    phone: z.string().nullable().optional(),
    seasonId: z.string().min(1, "SeasonId jest wymagany"),
  })
  .transform((o) => ({
    firstName: o.firstName.trim(),
    lastName: o.lastName.trim(),
    email: (o.email?.trim() || undefined) as string | undefined,
    phone: (o.phone?.trim() || undefined) as string | undefined,
    seasonId: o.seasonId,
  }));

export const GET: APIRoute = async ({ url }) => {
  const seasonId = url.searchParams.get("seasonId");

  const referees = await prisma.referee.findMany({
    where: seasonId ? { seasonId } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return json(referees);
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  const parsed = CreateRefereeSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  const referee = await createReferee(parsed.data);
  return json(referee, 201);
};
