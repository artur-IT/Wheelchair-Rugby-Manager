import type { APIRoute } from "astro";
import { z } from "zod";
import { json } from "@/lib/api";
import { createMatchForTournament, listMatchesForTournament } from "@/lib/tournaments";

const CreateMatchSchema = z
  .object({
    teamAId: z.string().min(1, "Wybierz drużynę A"),
    teamBId: z.string().min(1, "Wybierz drużynę B"),
    scheduledAt: z.string().datetime("Nieprawidłowa data/godzina"),
    court: z.string().min(1).optional(),
    jerseyInfo: z.string().min(1).optional(),
    scoreA: z.number().int().min(0).optional(),
    scoreB: z.number().int().min(0).optional(),
  })
  .refine((data) => data.teamAId !== data.teamBId, {
    message: "Drużyny muszą być różne",
    path: ["teamBId"],
  });

export const GET: APIRoute = async ({ params }) => {
  const { id } = params;
  if (!id) return json({ error: "Brak id turnieju" }, 400);

  try {
    const matches = await listMatchesForTournament(id);
    return json(matches, 200);
  } catch (error) {
    if (error instanceof Error && error.message === "TOURNAMENT_NOT_FOUND") {
      return json({ error: "Nie znaleziono turnieju" }, 404);
    }
    console.error("Failed to list matches:", error);
    return json({ error: "Nie udało się pobrać meczów" }, 500);
  }
};

export const POST: APIRoute = async ({ params, request }) => {
  const { id } = params;
  if (!id) return json({ error: "Brak id turnieju" }, 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Nieprawidłowy format JSON" }, 400);
  }

  const parsed = CreateMatchSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  try {
    await createMatchForTournament(id, parsed.data);
    return json({ ok: true }, 200);
  } catch (error) {
    if (error instanceof Error && error.message === "TOURNAMENT_NOT_FOUND") {
      return json({ error: "Nie znaleziono turnieju" }, 404);
    }
    if (error instanceof Error && error.message === "TEAM_NOT_IN_TOURNAMENT") {
      return json({ error: "Wybrane drużyny nie należą do turnieju" }, 400);
    }
    console.error("Failed to create match:", error);
    return json({ error: "Nie udało się utworzyć meczu" }, 500);
  }
};
