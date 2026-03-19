import type { APIRoute } from "astro";
import { json } from "@/lib/api";
import { removeRefereeFromTournament } from "@/lib/tournaments";

export const DELETE: APIRoute = async ({ params }) => {
  const { id, refereeId } = params;
  if (!id) return json({ error: "Brak id turnieju" }, 400);
  if (!refereeId) return json({ error: "Brak id sędziego" }, 400);

  try {
    await removeRefereeFromTournament(id, refereeId);
    return json({ ok: true }, 200);
  } catch (error) {
    console.error("Failed to remove referee from tournament:", error);
    return json({ error: "Nie udało się usunąć sędziego z turnieju" }, 500);
  }
};
