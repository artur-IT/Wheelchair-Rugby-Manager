import type { APIRoute } from "astro";
import { z } from "zod";

import { json } from "@/lib/api";
import { updateRefereePlanMatchForTournament } from "@/lib/refereePlan";

const UpsertRefereePlanMatchSchema = z
  .object({
    teamAId: z.string().min(1, "Wybierz drużynę A"),
    teamBId: z.string().min(1, "Wybierz drużynę B"),
    scheduledAt: z.string().datetime("Nieprawidłowa data/godzina"),
    court: z.string().min(1).optional(),
    referee1Id: z.string().min(1).optional(),
    referee2Id: z.string().min(1).optional(),
    tablePenaltyId: z.string().min(1).optional(),
    tableClockId: z.string().min(1).optional(),
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

  const parsed = UpsertRefereePlanMatchSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  try {
    await updateRefereePlanMatchForTournament(id, matchId, parsed.data);
    return json({ ok: true }, 200);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "TOURNAMENT_NOT_FOUND") return json({ error: "Nie znaleziono turnieju" }, 404);
      if (error.message === "MATCH_NOT_FOUND") return json({ error: "Nie znaleziono meczu" }, 404);
      if (error.message === "TEAM_NOT_IN_TOURNAMENT")
        return json({ error: "Wybrane drużyny nie należą do turnieju" }, 400);
      if (error.message === "REFEREE_NOT_FOUND") return json({ error: "Nie znaleziono sędziego" }, 400);
      if (error.message === "REFEREE_NOT_IN_TOURNAMENT")
        return json({ error: "Wybrany sędzia nie należy do turnieju" }, 400);
      if (error.message === "DUPLICATE_REFEREE_IN_MATCH")
        return json({ error: "Ten sam sędzia nie może pełnić kilku ról w jednym meczu" }, 400);
    }

    console.error("Failed to update referee plan entry:", error);
    return json({ error: "Nie udało się zaktualizować wpisu w planie sędziów" }, 500);
  }
};
