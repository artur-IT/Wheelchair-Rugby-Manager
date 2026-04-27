import { getErrorMessageFromResponse, parseFormErrorFromResponse } from "@/lib/apiHttp";
import type { Season } from "@/types";

/** Body for POST /api/seasons and PATCH /api/seasons/:id */
export interface SeasonUpsertBody {
  name: string;
  year?: number;
  description?: string;
}

/** POST /api/seasons */
export async function createSeason(body: SeasonUpsertBody): Promise<Season> {
  const res = await fetch("/api/seasons", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = await parseFormErrorFromResponse(res, "Nie udało się zapisać sezonu");
    throw new Error(msg);
  }
  return res.json() as Promise<Season>;
}

/** PATCH /api/seasons/:id */
export async function updateSeason(id: string, body: SeasonUpsertBody): Promise<Season> {
  const res = await fetch(`/api/seasons/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = await parseFormErrorFromResponse(res, "Nie udało się zapisać sezonu");
    throw new Error(msg);
  }
  return res.json() as Promise<Season>;
}

/** GET /api/seasons */
export async function fetchSeasonsList(signal?: AbortSignal): Promise<Season[]> {
  const res = await fetch("/api/seasons", { signal });
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, "Nie udało się pobrać sezonów");
    throw new Error(msg);
  }
  return res.json() as Promise<Season[]>;
}

/** DELETE /api/seasons/:id */
export async function deleteSeasonById(id: string): Promise<void> {
  const res = await fetch(`/api/seasons/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, "Nie udało się usunąć sezonu");
    throw new Error(msg);
  }
}

/** GET /api/seasons/:id */
export async function fetchSeasonById(id: string, signal?: AbortSignal): Promise<Season> {
  const res = await fetch("/api/seasons", { signal });
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, "Nie udało się pobrać sezonu.");
    throw new Error(msg);
  }
  const seasons = (await res.json()) as Season[];
  const season = seasons.find((candidate) => candidate.id === id);
  if (!season) {
    throw new Error("Nie znaleziono zasobu.");
  }
  return season;
}
