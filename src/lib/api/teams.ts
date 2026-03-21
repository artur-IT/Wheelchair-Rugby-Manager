import { getErrorMessageFromResponse } from "@/lib/apiHttp";
import type { Team } from "@/types";

/** GET /api/teams?seasonId=… */
export async function fetchTeamsBySeason(seasonId: string, signal?: AbortSignal): Promise<Team[]> {
  const res = await fetch(`/api/teams?seasonId=${encodeURIComponent(seasonId)}`, { signal });
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, "Nie udało się pobrać drużyn");
    throw new Error(msg);
  }
  return res.json() as Promise<Team[]>;
}

/** GET /api/teams/:id — returns null when the team does not exist (404). */
export async function fetchTeamById(id: string, signal?: AbortSignal): Promise<Team | null> {
  const res = await fetch(`/api/teams/${id}`, { signal });
  if (res.status === 404) return null;
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, "Nie udało się pobrać drużyny");
    throw new Error(msg);
  }
  return res.json() as Promise<Team>;
}

/** DELETE /api/teams/:id */
export async function deleteTeamById(id: string): Promise<void> {
  const res = await fetch(`/api/teams/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, "Nie udało się usunąć drużyny");
    throw new Error(msg);
  }
}
