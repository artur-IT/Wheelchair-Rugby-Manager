import type { APIRoute } from "astro";
import { z } from "zod";
import { json } from "@/lib/api";
import { addRefereesToTournament } from "@/lib/tournaments";

const AddRefereesSchema = z.object({
  refereeIds: z.array(z.string().min(1)).min(1, "Wybierz przynajmniej jednego sędziego"),
});

export const POST: APIRoute = async ({ params, request }) => {
  const { id } = params;
  if (!id) return json({ error: "Brak id turnieju" }, 400);

  const body = await request.json().catch(() => null);
  const parsed = AddRefereesSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  try {
    await addRefereesToTournament(id, parsed.data.refereeIds);
    return json({ ok: true }, 200);
  } catch (error) {
    if (error instanceof Error && error.message === "TOURNAMENT_NOT_FOUND") {
      return json({ error: "Nie znaleziono turnieju" }, 404);
    }
    if (error instanceof Error && error.message === "REFEREE_NOT_FOUND") {
      return json({ error: "Nie znaleziono jednego z sędziów" }, 404);
    }
    if (error instanceof Error && error.message === "REFEREE_WRONG_SEASON") {
      return json({ error: "Wybrany sędzia jest z innego sezonu" }, 400);
    }
    console.error("Failed to add referees to tournament:", error);
    return json({ error: "Nie udało się dodać sędziów do turnieju" }, 500);
  }
};
