import type { APIRoute } from "astro";
import { z } from "zod";
import { json } from "@/lib/api";
import { deleteClassifierPlanEntryForTournament, updateClassifierPlanEntryForTournament } from "@/lib/classifierPlan";

const UpsertClassifierPlanSchema = z.object({
  playerId: z.string().min(1, "Wybierz zawodnika"),
  scheduledAt: z.string().datetime("Nieprawidłowa data/godzina"),
  endsAt: z.string().datetime("Nieprawidłowa data/godzina zakończenia"),
  classification: z
    .number()
    .min(0, "Klasyfikacja nie może być ujemna")
    .max(4, "Maksymalna klasyfikacja to 4")
    .refine((v) => Number.isInteger(v * 2), "Klasyfikacja musi mieć krok 0.5")
    .optional(),
  observation: z.boolean().optional(),
});

export const PUT: APIRoute = async ({ params, request }) => {
  const { id, examId } = params;
  if (!id) return json({ error: "Brak id turnieju" }, 400);
  if (!examId) return json({ error: "Brak id badania" }, 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Nieprawidłowy format JSON" }, 400);
  }

  const parsed = UpsertClassifierPlanSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  try {
    await updateClassifierPlanEntryForTournament(id, examId, parsed.data);
    return json({ ok: true }, 200);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "TOURNAMENT_NOT_FOUND") return json({ error: "Nie znaleziono turnieju" }, 404);
      if (error.message === "EXAM_NOT_FOUND") return json({ error: "Nie znaleziono badania" }, 404);
      if (error.message === "PLAYER_NOT_IN_TOURNAMENT")
        return json({ error: "Wybrany zawodnik nie należy do turnieju" }, 400);
      if (error.message === "INVALID_SCHEDULED_AT") return json({ error: "Nieprawidłowa data/godzina" }, 400);
      if (error.message === "INVALID_CLASSIFICATION") return json({ error: "Nieprawidłowa klasyfikacja" }, 400);
      if (error.message === "INVALID_ENDS_AT") return json({ error: "Nieprawidłowa data/godzina zakończenia" }, 400);
      if (error.message === "TIME_CONFLICT")
        return json({ error: "W tym czasie jest już zaplanowane inne badanie" }, 400);
    }
    return json({ error: "Nie udało się zaktualizować wpisu w planie klasyfikatorów" }, 500);
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  const { id, examId } = params;
  if (!id) return json({ error: "Brak id turnieju" }, 400);
  if (!examId) return json({ error: "Brak id badania" }, 400);

  try {
    await deleteClassifierPlanEntryForTournament(id, examId);
    return json({ ok: true }, 200);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "TOURNAMENT_NOT_FOUND") return json({ error: "Nie znaleziono turnieju" }, 404);
      if (error.message === "EXAM_NOT_FOUND") return json({ error: "Nie znaleziono badania" }, 404);
    }
    return json({ error: "Nie udało się usunąć wpisu z planu klasyfikatorów" }, 500);
  }
};
