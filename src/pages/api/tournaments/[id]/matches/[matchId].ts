import type { APIRoute } from "astro";
import { z } from "zod";
import { json } from "@/lib/api";
import { deleteMatchForTournament, updateMatchForTournament } from "@/lib/tournaments";

const UpdateMatchSchema = z
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

export const PUT: APIRoute = async ({ params, request }) => {
  const { id, matchId } = params;
  if (!id) return json({ error: "Brak id turnieju" }, 400);
  if (!matchId) return json({ error: "Brak id meczu" }, 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Nieprawidłowy format JSON" }, 400);
  }

  const parsed = UpdateMatchSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  try {
    await updateMatchForTournament(id, matchId, parsed.data);
    return json({ ok: true }, 200);
  } catch (error) {
    if (error instanceof Error && error.message === "TOURNAMENT_NOT_FOUND") {
      return json({ error: "Nie znaleziono turnieju" }, 404);
    }
    if (error instanceof Error && error.message === "MATCH_NOT_FOUND") {
      return json({ error: "Nie znaleziono meczu" }, 404);
    }
    if (error instanceof Error && error.message === "TEAM_NOT_IN_TOURNAMENT") {
      return json({ error: "Wybrane drużyny nie należą do turnieju" }, 400);
    }
    if (error instanceof Error && error.message === "COURT_TIME_CONFLICT") {
      return json({ error: "Na tym boisku jest już mecz w tym czasie. Wybierz inną godzinę startu." }, 400);
    }
    return json({ error: "Nie udało się zaktualizować meczu" }, 500);
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  const { id, matchId } = params;
  if (!id) return json({ error: "Brak id turnieju" }, 400);
  if (!matchId) return json({ error: "Brak id meczu" }, 400);

  try {
    await deleteMatchForTournament(id, matchId);
    return json({ ok: true }, 200);
  } catch (error) {
    if (error instanceof Error && error.message === "TOURNAMENT_NOT_FOUND") {
      return json({ error: "Nie znaleziono turnieju" }, 404);
    }
    if (error instanceof Error && error.message === "MATCH_NOT_FOUND") {
      return json({ error: "Nie znaleziono meczu" }, 404);
    }
    return json({ error: "Nie udało się usunąć meczu" }, 500);
  }
};
