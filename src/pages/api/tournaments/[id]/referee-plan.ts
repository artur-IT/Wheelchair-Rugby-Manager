import type { APIRoute } from "astro";
import { z } from "zod";

import { json } from "@/lib/api";
import { createRefereePlanMatchForTournament, listRefereePlanForTournament } from "@/lib/refereePlan";

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

export const GET: APIRoute = async ({ params }) => {
  const { id } = params;
  if (!id) return json({ error: "Brak id turnieju" }, 400);

  try {
    const plan = await listRefereePlanForTournament(id);
    return json(plan, 200);
  } catch (error) {
    if (error instanceof Error && error.message === "TOURNAMENT_NOT_FOUND") {
      return json({ error: "Nie znaleziono turnieju" }, 404);
    }

    console.error("Failed to list referee plan:", error);
    return json({ error: "Nie udało się pobrać planu sędziów" }, 500);
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

  const parsed = UpsertRefereePlanMatchSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  try {
    await createRefereePlanMatchForTournament(id, parsed.data);
    return json({ ok: true }, 200);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "TOURNAMENT_NOT_FOUND") return json({ error: "Nie znaleziono turnieju" }, 404);
      if (error.message === "TEAM_NOT_IN_TOURNAMENT")
        return json({ error: "Wybrane drużyny nie należą do turnieju" }, 400);
      if (error.message === "REFEREE_NOT_FOUND") return json({ error: "Nie znaleziono sędziego" }, 400);
      if (error.message === "REFEREE_NOT_IN_TOURNAMENT")
        return json({ error: "Wybrany sędzia nie należy do turnieju" }, 400);
      if (error.message === "DUPLICATE_REFEREE_IN_MATCH")
        return json({ error: "Ten sam sędzia nie może pełnić kilku ról w jednym meczu" }, 400);
    }

    console.error("Failed to create referee plan entry:", error);
    return json({ error: "Nie udało się utworzyć wpisu w planie sędziów" }, 500);
  }
};
