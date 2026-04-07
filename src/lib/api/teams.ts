import { getErrorMessageFromResponse } from "@/lib/apiHttp";
import type { Team } from "@/types";

interface TeamPlayerPayload {
  id?: string;
  firstName: string;
  lastName: string;
  classification?: number;
  number?: number;
}

interface TeamUpdatePayload {
  name: string;
  address: string;
  city?: string;
  postalCode?: string;
  websiteUrl?: string;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactPhone: string;
  seasonId: string;
  coachId?: string;
  refereeId?: string;
  staff?: { firstName: string; lastName: string }[];
  players: TeamPlayerPayload[];
}

export interface TeamCreatePayload {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  websiteUrl?: string;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactPhone: string;
  seasonId: string;
  coachId?: string;
  refereeId?: string;
  staff?: { firstName: string; lastName: string }[];
  players: TeamPlayerPayload[];
}

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

/** PUT /api/teams/:id */
export async function updateTeamById(id: string, body: TeamUpdatePayload): Promise<Team> {
  const res = await fetch(`/api/teams/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, "Nie udało się zaktualizować drużyny");
    throw new Error(msg);
  }
  return res.json() as Promise<Team>;
}

/** POST /api/teams */
export async function createTeam(body: TeamCreatePayload): Promise<Team> {
  const res = await fetch("/api/teams", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, "Nie udało się zapisać drużyny");
    throw new Error(msg);
  }
  return res.json() as Promise<Team>;
}
