import type { APIRoute } from "astro";
import { json } from "@/lib/api";
import { removeClassifierFromTournament } from "@/lib/tournaments";

export const DELETE: APIRoute = async ({ params }) => {
  const { id, classifierId } = params;
  if (!id) return json({ error: "Brak id turnieju" }, 400);
  if (!classifierId) return json({ error: "Brak id klasyfikatora" }, 400);

  try {
    await removeClassifierFromTournament(id, classifierId);
    return json({ ok: true }, 200);
  } catch (error) {
    console.error("Failed to remove classifier from tournament:", error);
    return json({ error: "Nie udało się usunąć klasyfikatora z turnieju" }, 500);
  }
};
