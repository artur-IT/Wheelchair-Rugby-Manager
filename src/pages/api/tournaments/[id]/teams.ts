import type { APIRoute } from "astro";
import { z } from "zod";
import { json } from "@/lib/api";
import { addTeamsToTournament } from "@/lib/tournaments";

const AddTeamsSchema = z.object({
  teamIds: z.array(z.string().min(1)).min(1, "Wybierz przynajmniej jedną drużynę"),
});

export const POST: APIRoute = async ({ params, request }) => {
  const { id } = params;
  if (!id) return json({ error: "Brak id turnieju" }, 400);

  const body = await request.json().catch(() => null);
  const parsed = AddTeamsSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  try {
    await addTeamsToTournament(id, parsed.data.teamIds);
    return json({ ok: true }, 200);
  } catch (error) {
    if (error instanceof Error && error.message === "TOURNAMENT_NOT_FOUND") {
      return json({ error: "Nie znaleziono turnieju" }, 404);
    }
    if (error instanceof Error && error.message === "TEAM_NOT_FOUND") {
      return json({ error: "Nie znaleziono jednej z drużyn" }, 404);
    }
    if (error instanceof Error && error.message === "TEAM_WRONG_SEASON") {
      return json({ error: "Wybrana drużyna jest z innego sezonu" }, 400);
    }

    console.error("Failed to add teams to tournament:", error);
    return json({ error: "Nie udało się dodać drużyn do turnieju" }, 500);
  }
};
