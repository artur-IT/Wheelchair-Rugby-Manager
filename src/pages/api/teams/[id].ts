import type { APIRoute } from "astro";
import { z } from "zod";
import { json } from "@/lib/api";
import { getTeamById, updateTeam } from "@/lib/teams";

const UpdateTeamSchema = z
  .object({
    name: z.string().min(1, "Nazwa drużyny jest wymagana"),
    address: z.string().min(1, "Adres jest wymagany"),
    logoUrl: z.union([z.string().url("Nieprawidłowy adres URL"), z.literal("")]).optional(),
    contactFirstName: z.string().min(1, "Imię jest wymagane"),
    contactLastName: z.string().min(1, "Nazwisko jest wymagane"),
    contactEmail: z.string().email("Nieprawidłowy email"),
    contactPhone: z.string().min(1, "Telefon jest wymagany"),
    seasonId: z.string().optional(),
    coachId: z.string().optional(),
    refereeId: z.string().optional(),
    staff: z.array(z.object({ firstName: z.string().min(1), lastName: z.string().min(1) })).optional(),
    // Required on update so we never accidentally wipe players when key is missing
    players: z.array(
      z.object({
        firstName: z.string().min(1, "Imię jest wymagane"),
        lastName: z.string().min(1, "Nazwisko jest wymagane"),
        classification: z
          .union([z.number(), z.string().transform((s) => (s === "" ? undefined : Number(s)))])
          .optional(),
        number: z
          .union([z.number().int().positive(), z.string().transform((s) => (s === "" ? undefined : Number(s)))])
          .optional(),
      })
    ),
  })
  .transform((o) => ({
    ...o,
    logoUrl: (o.logoUrl?.trim() || undefined) as string | undefined,
    coachId: o.coachId?.trim() || undefined,
    refereeId: o.refereeId?.trim() || undefined,
    // Normalise players so updateTeam always receives a defined array
    players: o.players.map((p) => ({
      firstName: p.firstName.trim(),
      lastName: p.lastName.trim(),
      classification:
        typeof p.classification === "number" && !Number.isNaN(p.classification) ? p.classification : undefined,
      number: typeof p.number === "number" && !Number.isNaN(p.number) ? Math.floor(p.number) : undefined,
    })),
  }));

export const GET: APIRoute = async ({ params }) => {
  const id = params?.id;
  if (!id) return json({ error: "Missing team id" }, 400);

  const team = await getTeamById(id);
  if (!team) return json({ error: "Team not found" }, 404);

  return json(team);
};

export const PUT: APIRoute = async ({ params, request }) => {
  const id = params?.id;
  if (!id) return json({ error: "Missing team id" }, 400);

  const body = await request.json().catch(() => null);
  const parsed = UpdateTeamSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  try {
    const team = await updateTeam(id, parsed.data);
    return json(team);
  } catch {
    return json({ error: "Nie udało się zaktualizować drużyny" }, 500);
  }
};
