import type { APIRoute } from "astro";
import { z } from "@/lib/zodPl";
import { prisma } from "@/lib/prisma";
import { json } from "@/lib/api";
import { createTeam } from "@/lib/teams";
import { Prisma } from "generated/prisma/client";
import { LOOSE_URL_REGEX, POSTAL_CODE_REGEX, toTitleCase } from "@/lib/validateInputs";

const CreateTeamSchema = z
  .object({
    name: z.string().min(1, "Nazwa drużyny jest wymagana"),
    address: z.string().min(1, "Adres jest wymagany"),
    city: z.string().min(1, "Miasto jest wymagane"),
    postalCode: z.string().regex(POSTAL_CODE_REGEX, "Kod pocztowy musi być w formacie XX-XXX"),
    websiteUrl: z
      .union([z.string().refine((v) => LOOSE_URL_REGEX.test(v), "Nieprawidłowy adres URL"), z.literal("")])
      .optional(),
    contactFirstName: z.string().min(1, "Imię jest wymagane"),
    contactLastName: z.string().min(1, "Nazwisko jest wymagane"),
    contactEmail: z.string().email("Nieprawidłowy email"),
    contactPhone: z.string().min(1, "Telefon jest wymagany"),
    seasonId: z.string().min(1, "Id sezonu jest wymagane"),
    coachId: z.string().optional(),
    refereeId: z.string().optional(),
    staff: z.array(z.object({ firstName: z.string().min(1), lastName: z.string().min(1) })).optional(),
    players: z
      .array(
        z.object({
          id: z.string().optional(),
          firstName: z.string().min(1, "Imię jest wymagane"),
          lastName: z.string().min(1, "Nazwisko jest wymagane"),
          classification: z
            .union([z.number(), z.string().transform((s) => (s === "" ? undefined : Number(s)))])
            .optional(),
          number: z
            .union([z.number().int().positive(), z.string().transform((s) => (s === "" ? undefined : Number(s)))])
            .optional(),
        })
      )
      .optional(),
  })
  .transform((o) => ({
    ...o,
    name: toTitleCase(o.name),
    address: toTitleCase(o.address),
    city: toTitleCase(o.city),
    contactFirstName: toTitleCase(o.contactFirstName),
    contactLastName: toTitleCase(o.contactLastName),
    websiteUrl: (o.websiteUrl?.trim() || undefined) as string | undefined,
    coachId: o.coachId?.trim() || undefined,
    refereeId: o.refereeId?.trim() || undefined,
    staff: o.staff?.map((s) => ({
      firstName: toTitleCase(s.firstName),
      lastName: toTitleCase(s.lastName),
    })),
    players: o.players?.map((p) => ({
      id: p.id?.trim() || undefined,
      firstName: toTitleCase(p.firstName),
      lastName: toTitleCase(p.lastName),
      classification:
        typeof p.classification === "number" && !Number.isNaN(p.classification) ? p.classification : undefined,
      number: typeof p.number === "number" && !Number.isNaN(p.number) ? Math.floor(p.number) : undefined,
    })),
  }));

export const GET: APIRoute = async ({ url }) => {
  const seasonId = url.searchParams.get("seasonId");

  const teams = await prisma.team.findMany({
    where: seasonId ? { seasonId } : undefined,
    orderBy: { createdAt: "desc" },
    include: { players: true, staff: true, coach: true },
  });

  return json(teams);
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  const parsed = CreateTeamSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  try {
    const team = await createTeam(parsed.data);
    return json(team, 201);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return json({ error: "Drużyna o tej nazwie już istnieje w tym sezonie" }, 409);
      }
      if (error.code === "P2003") {
        return json({ error: "Nieprawidłowy identyfikator sezonu" }, 400);
      }
    }
    return json({ error: "Nie udało się utworzyć drużyny" }, 500);
  }
};
