import type { APIRoute } from "astro";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { json } from "@/lib/api";
import { createTeam } from "@/lib/teams";

const CreateTeamSchema = z
  .object({
    name: z.string().min(1, "Nazwa drużyny jest wymagana"),
    address: z.string().min(1, "Adres jest wymagany"),
    logoUrl: z.union([z.string().url("Nieprawidłowy adres URL"), z.literal("")]).optional(),
    contactFirstName: z.string().min(1, "Imię jest wymagane"),
    contactLastName: z.string().min(1, "Nazwisko jest wymagane"),
    contactEmail: z.string().email("Nieprawidłowy email"),
    contactPhone: z.string().min(1, "Telefon jest wymagany"),
    seasonId: z.string().min(1, "SeasonId jest wymagany"),
    coachId: z.string().optional(),
    refereeId: z.string().optional(),
  })
  .transform((o) => ({
    ...o,
    logoUrl: (o.logoUrl?.trim() || undefined) as string | undefined,
    coachId: o.coachId?.trim() || undefined,
    refereeId: o.refereeId?.trim() || undefined,
  }));

export const GET: APIRoute = async ({ url }) => {
  const seasonId = url.searchParams.get("seasonId");

  const teams = await prisma.team.findMany({
    where: seasonId ? { seasonId } : undefined,
    orderBy: { createdAt: "desc" },
    include: { players: true },
  });

  return json(teams);
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  const parsed = CreateTeamSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  const team = await createTeam(parsed.data);
  return json(team, 201);
};
