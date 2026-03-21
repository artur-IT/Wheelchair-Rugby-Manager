import { getErrorMessageFromResponse } from "@/lib/apiHttp";
import type { TournamentFormData } from "@/lib/validateInputs";
import type { Tournament } from "@/types";

/** GET /api/tournaments/:id */
export async function fetchTournamentById(id: string, signal?: AbortSignal): Promise<Tournament> {
  const res = await fetch(`/api/tournaments/${id}`, { signal });
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, "Nie udało się pobrać turnieju do edycji");
    throw new Error(msg);
  }
  return res.json() as Promise<Tournament>;
}

/** POST /api/tournaments */
export async function createTournament(body: TournamentFormData): Promise<Tournament> {
  const res = await fetch("/api/tournaments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, "Nie udało się zapisać turnieju");
    throw new Error(msg);
  }
  return res.json() as Promise<Tournament>;
}

/** PUT /api/tournaments/:id */
export async function updateTournament(id: string, body: TournamentFormData): Promise<Tournament> {
  const res = await fetch(`/api/tournaments/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, "Nie udało się zapisać turnieju");
    throw new Error(msg);
  }
  return res.json() as Promise<Tournament>;
}

/** GET /api/tournaments */
export async function fetchTournamentsList(signal?: AbortSignal): Promise<Tournament[]> {
  const res = await fetch("/api/tournaments", { signal });
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, "Nie udało się pobrać turniejów");
    throw new Error(msg);
  }
  return res.json() as Promise<Tournament[]>;
}

/** DELETE /api/tournaments/:id */
export async function deleteTournamentById(id: string): Promise<void> {
  const res = await fetch(`/api/tournaments/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, "Nie udało się usunąć turnieju");
    throw new Error(msg);
  }
}
