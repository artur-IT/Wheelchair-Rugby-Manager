import type { APIRoute } from "astro";
import { z } from "@/lib/zodPl";
import { json } from "@/lib/api";
import { getTeamById, updateTeam } from "@/lib/teams";
import { prisma } from "@/lib/prisma";
import { Prisma } from "generated/prisma/client";
import { LOOSE_URL_REGEX, POSTAL_CODE_REGEX, toTitleCase } from "@/lib/validateInputs";

const UpdateTeamSchema = z
  .object({
    name: z.string().min(1, "Nazwa drużyny jest wymagana"),
    address: z.string().min(1, "Adres jest wymagany").optional(),
    city: z.string().min(1, "Miasto jest wymagane").optional(),
    postalCode: z.string().regex(POSTAL_CODE_REGEX, "Kod pocztowy musi być w formacie XX-XXX").optional(),
    websiteUrl: z
      .union([z.string().refine((v) => LOOSE_URL_REGEX.test(v), "Nieprawidłowy adres URL"), z.literal("")])
      .optional(),
    contactFirstName: z.string().min(1, "Imię jest wymagane").optional(),
    contactLastName: z.string().min(1, "Nazwisko jest wymagane").optional(),
    contactEmail: z.string().email("Nieprawidłowy adres e-mail").optional(),
    contactPhone: z.string().min(1, "Telefon jest wymagany").optional(),
    seasonId: z.string().optional(),
    coachId: z.string().optional(),
    refereeId: z.string().optional(),
    staff: z.array(z.object({ firstName: z.string().min(1), lastName: z.string().min(1) })).optional(),
    // Required on update so we never accidentally wipe players when key is missing
    players: z.array(
      z.object({
        id: z.string().optional(),
        firstName: z.string().min(1, "Imię jest wymagane"),
        lastName: z.string().min(1, "Nazwisko jest wymagane"),
        classification: z
          .union([z.number(), z.string().transform((s) => (s === "" ? undefined : Number(s)))])
          .optional(),
        number: z
          .union([z.number().int().positive(), z.string().transform((s) => (s === "" ? undefined : Number(s)))])
          .refine((val) => val === undefined || (Number.isInteger(val) && val > 0), {
            message: "Numer musi być dodatnią liczbą całkowitą",
          })
          .optional(),
      })
    ),
  })
  .transform((o) => ({
    ...o,
    name: toTitleCase(o.name),
    address: o.address ? toTitleCase(o.address) : undefined,
    city: o.city ? toTitleCase(o.city) : undefined,
    contactFirstName: o.contactFirstName ? toTitleCase(o.contactFirstName) : undefined,
    contactLastName: o.contactLastName ? toTitleCase(o.contactLastName) : undefined,
    websiteUrl: (o.websiteUrl?.trim() || undefined) as string | undefined,
    coachId: o.coachId?.trim() || undefined,
    refereeId: o.refereeId?.trim() || undefined,
    staff: o.staff?.map((s) => ({
      firstName: toTitleCase(s.firstName),
      lastName: toTitleCase(s.lastName),
    })),
    // Normalise players so updateTeam always receives a defined array
    players: o.players.map((p) => ({
      id: p.id?.trim() || undefined,
      firstName: toTitleCase(p.firstName),
      lastName: toTitleCase(p.lastName),
      classification:
        typeof p.classification === "number" && !Number.isNaN(p.classification) ? p.classification : undefined,
      number: typeof p.number === "number" && !Number.isNaN(p.number) ? Math.floor(p.number) : undefined,
    })),
  }));

export const GET: APIRoute = async ({ params }) => {
  const id = params?.id;
  if (!id) return json({ error: "Brak id drużyny" }, 400);

  const team = await getTeamById(id);
  if (!team) return json({ error: "Nie znaleziono drużyny" }, 404);

  return json(team);
};

export const PUT: APIRoute = async ({ params, request }) => {
  const id = params?.id;
  if (!id) return json({ error: "Brak id drużyny" }, 400);

  const existingTeam = await getTeamById(id);
  if (!existingTeam) return json({ error: "Nie znaleziono drużyny" }, 404);

  const body = await request.json().catch(() => null);
  const parsed = UpdateTeamSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  try {
    const team = await updateTeam(id, parsed.data);
    return json(team);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const target = Array.isArray(error.meta?.target) ? error.meta.target.join(",") : String(error.meta?.target ?? "");
        if (target.includes("teamId") && target.includes("number")) {
          return json({ error: "Numer zawodnika musi być unikalny w drużynie" }, 409);
        }
        return json({ error: "Drużyna o tej nazwie już istnieje w tym sezonie" }, 409);
      }
    }
    return json({ error: "Nie udało się zaktualizować drużyny" }, 500);
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = params?.id;
  if (!id) return json({ error: "Brak id drużyny" }, 400);

  const existingTeam = await getTeamById(id);
  if (!existingTeam) return json({ error: "Nie znaleziono drużyny" }, 404);

  try {
    await prisma.team.delete({ where: { id } });
    return json({ success: true });
  } catch {
    return json({ error: "Nie udało się usunąć drużyny" }, 500);
  }
};
