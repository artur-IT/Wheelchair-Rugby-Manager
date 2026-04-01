import type { APIRoute } from "astro";
import { Prisma } from "@prisma/client";
import { z } from "@/lib/zodPl";
import { json } from "@/lib/api";
import { createClassifierPlanEntryForTournament, listClassifierPlanForTournament } from "@/lib/classifierPlan";

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

export const GET: APIRoute = async ({ params }) => {
  const { id } = params;
  if (!id) return json({ error: "Brak id turnieju" }, 400);

  try {
    const plan = await listClassifierPlanForTournament(id);
    return json(plan, 200);
  } catch (error) {
    if (error instanceof Error && error.message === "TOURNAMENT_NOT_FOUND") {
      return json({ error: "Nie znaleziono turnieju" }, 404);
    }
    return json({ error: "Nie udało się pobrać planu klasyfikatorów" }, 500);
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

  const parsed = UpsertClassifierPlanSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  try {
    await createClassifierPlanEntryForTournament(id, parsed.data);
    return json({ ok: true }, 200);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "TOURNAMENT_NOT_FOUND") return json({ error: "Nie znaleziono turnieju" }, 404);
      if (error.message === "PLAYER_NOT_IN_TOURNAMENT")
        return json({ error: "Wybrany zawodnik nie należy do turnieju" }, 400);
      if (error.message === "NO_CLASSIFIER_IN_TOURNAMENT")
        return json({ error: "Brak klasyfikatora w turnieju. Dodaj klasyfikatora do personelu." }, 400);
      if (error.message === "INVALID_SCHEDULED_AT") return json({ error: "Nieprawidłowa data/godzina" }, 400);
      if (error.message === "INVALID_CLASSIFICATION") return json({ error: "Nieprawidłowa klasyfikacja" }, 400);
      if (error.message === "INVALID_ENDS_AT") return json({ error: "Nieprawidłowa data/godzina zakończenia" }, 400);
      if (error.message === "TIME_CONFLICT")
        return json({ error: "W tym czasie jest już zaplanowane inne badanie" }, 400);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return json(
          {
            error:
              "Ten zawodnik ma już badanie u tego klasyfikatora w turnieju. Zmień termin w edycji planu zamiast dodawać wpis ponownie.",
          },
          409
        );
      }
    }
    return json({ error: "Nie udało się utworzyć wpisu w planie klasyfikatorów" }, 500);
  }
};
