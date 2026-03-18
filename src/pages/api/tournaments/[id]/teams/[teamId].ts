import type { APIRoute } from "astro";
import { json } from "@/lib/api";
import { removeTeamFromTournament } from "@/lib/tournaments";

export const DELETE: APIRoute = async ({ params }) => {
  const { id, teamId } = params;
  if (!id) return json({ error: "Brak id turnieju" }, 400);
  if (!teamId) return json({ error: "Brak id drużyny" }, 400);

  try {
    await removeTeamFromTournament(id, teamId);
    return json({ ok: true }, 200);
  } catch (error) {
    console.error("Failed to remove team from tournament:", error);
    return json({ error: "Nie udało się usunąć drużyny z turnieju" }, 500);
  }
};
