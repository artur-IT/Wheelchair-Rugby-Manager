import type { APIRoute } from "astro";
import { z } from "@/lib/zodPl";
import { json } from "@/lib/api";
import { removeTeamFromTournament, setTournamentTeamPlayers } from "@/lib/tournaments";

const SetTournamentTeamPlayersSchema = z.object({
  playerIds: z.array(z.string().min(1)),
});

export const DELETE: APIRoute = async ({ params }) => {
  const { id, teamId } = params;
  if (!id) return json({ error: "Brak id turnieju" }, 400);
  if (!teamId) return json({ error: "Brak id drużyny" }, 400);

  try {
    await removeTeamFromTournament(id, teamId);
    return json({ ok: true }, 200);
  } catch {
    return json({ error: "Nie udało się usunąć drużyny z turnieju" }, 500);
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  const { id, teamId } = params;
  if (!id) return json({ error: "Brak id turnieju" }, 400);
  if (!teamId) return json({ error: "Brak id drużyny" }, 400);

  const body = await request.json().catch(() => null);
  const parsed = SetTournamentTeamPlayersSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  try {
    await setTournamentTeamPlayers(id, teamId, parsed.data.playerIds);
    return json({ ok: true }, 200);
  } catch (error) {
    if (error instanceof Error && error.message === "TOURNAMENT_NOT_FOUND") {
      return json({ error: "Nie znaleziono turnieju" }, 404);
    }
    if (error instanceof Error && error.message === "TEAM_NOT_IN_TOURNAMENT") {
      return json({ error: "Drużyna nie jest przypisana do turnieju" }, 400);
    }
    if (error instanceof Error && error.message === "PLAYER_NOT_IN_TEAM") {
      return json({ error: "Przynajmniej jeden zawodnik nie należy do tej drużyny" }, 400);
    }

    return json({ error: "Nie udało się zapisać składu drużyny dla turnieju" }, 500);
  }
};
