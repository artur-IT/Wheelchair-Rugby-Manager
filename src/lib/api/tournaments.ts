import { getErrorMessageFromResponse } from "@/lib/apiHttp";
import type { TournamentFormData } from "@/lib/validateInputs";
import type { ClassifierPlanEntry, Match, RefereePlanMatch, Tournament } from "@/types";

interface TournamentMatchPayload {
  teamAId: string;
  teamBId: string;
  scheduledAt: string;
  court?: string;
  jerseyInfo?: string;
  scoreA?: number;
  scoreB?: number;
}

interface TournamentRefereePlanPayload {
  teamAId: string;
  teamBId: string;
  scheduledAt: string;
  court?: string;
  referee1Id?: string;
  referee2Id?: string;
  tablePenaltyId?: string;
  tableClockId?: string;
}

interface TournamentClassifierPlanPayload {
  playerId: string;
  scheduledAt: string;
  endsAt: string;
  classification?: number;
  observation?: boolean;
}

/** GET /api/tournaments/:id — 404 returns null (details screen). */
export async function fetchTournamentByIdOrNull(id: string, signal?: AbortSignal): Promise<Tournament | null> {
  const res = await fetch(`/api/tournaments/${id}`, { signal });
  if (res.status === 404) return null;
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, "Nie udało się pobrać turnieju");
    throw new Error(msg);
  }
  return res.json() as Promise<Tournament>;
}

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

/** GET /api/tournaments/:tournamentId/matches */
export async function fetchTournamentMatches(tournamentId: string, signal?: AbortSignal): Promise<Match[]> {
  const res = await fetch(`/api/tournaments/${tournamentId}/matches`, { signal });
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, "Nie udało się pobrać meczów");
    throw new Error(msg);
  }
  return res.json() as Promise<Match[]>;
}

/** GET /api/tournaments/:tournamentId/referee-plan */
export async function fetchTournamentRefereePlan(
  tournamentId: string,
  signal?: AbortSignal
): Promise<RefereePlanMatch[]> {
  const res = await fetch(`/api/tournaments/${tournamentId}/referee-plan`, { signal });
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, "Nie udało się pobrać planu sędziów");
    throw new Error(msg);
  }
  return res.json() as Promise<RefereePlanMatch[]>;
}

/** DELETE /api/tournaments/:tournamentId/matches/:matchId */
export async function deleteTournamentMatch(tournamentId: string, matchId: string): Promise<void> {
  const res = await fetch(`/api/tournaments/${tournamentId}/matches/${matchId}`, { method: "DELETE" });
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, "Nie udało się usunąć meczu");
    throw new Error(msg);
  }
}

/** POST /api/tournaments/:tournamentId/matches */
export async function createTournamentMatch(tournamentId: string, body: TournamentMatchPayload): Promise<Match> {
  const res = await fetch(`/api/tournaments/${tournamentId}/matches`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, "Nie udało się utworzyć meczu");
    throw new Error(msg);
  }
  return res.json() as Promise<Match>;
}

/** PUT /api/tournaments/:tournamentId/matches/:matchId */
export async function updateTournamentMatch(
  tournamentId: string,
  matchId: string,
  body: TournamentMatchPayload
): Promise<Match> {
  const res = await fetch(`/api/tournaments/${tournamentId}/matches/${matchId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, "Nie udało się zaktualizować meczu");
    throw new Error(msg);
  }
  return res.json() as Promise<Match>;
}

/** POST /api/tournaments/:tournamentId/teams */
export async function setTournamentTeams(tournamentId: string, teamIds: string[]): Promise<void> {
  const res = await fetch(`/api/tournaments/${tournamentId}/teams`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ teamIds }),
  });
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, "Nie udało się dodać drużyn");
    throw new Error(msg);
  }
}

/** DELETE /api/tournaments/:tournamentId/teams/:teamId */
export async function removeTeamFromTournament(tournamentId: string, teamId: string): Promise<void> {
  const res = await fetch(`/api/tournaments/${tournamentId}/teams/${teamId}`, { method: "DELETE" });
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, "Nie udało się usunąć drużyny z turnieju");
    throw new Error(msg);
  }
}

/** PUT /api/tournaments/:tournamentId/teams/:teamId */
export async function setTournamentTeamPlayers(
  tournamentId: string,
  teamId: string,
  playerIds: string[]
): Promise<void> {
  const res = await fetch(`/api/tournaments/${tournamentId}/teams/${teamId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerIds }),
  });
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, "Nie udało się zapisać składu drużyny na turniej");
    throw new Error(msg);
  }
}

/** POST /api/tournaments/:tournamentId/referees */
export async function setTournamentReferees(tournamentId: string, refereeIds: string[]): Promise<void> {
  const res = await fetch(`/api/tournaments/${tournamentId}/referees`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refereeIds }),
  });
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, "Nie udało się dodać sędziów");
    throw new Error(msg);
  }
}

/** DELETE /api/tournaments/:tournamentId/referees/:refereeId */
export async function removeRefereeFromTournament(tournamentId: string, refereeId: string): Promise<void> {
  const res = await fetch(`/api/tournaments/${tournamentId}/referees/${refereeId}`, { method: "DELETE" });
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, "Nie udało się usunąć sędziego z turnieju");
    throw new Error(msg);
  }
}

/** POST /api/tournaments/:tournamentId/classifiers */
export async function setTournamentClassifiers(tournamentId: string, classifierIds: string[]): Promise<void> {
  const res = await fetch(`/api/tournaments/${tournamentId}/classifiers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ classifierIds }),
  });
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, "Nie udało się dodać klasyfikatorów");
    throw new Error(msg);
  }
}

/** DELETE /api/tournaments/:tournamentId/classifiers/:classifierId */
export async function removeClassifierFromTournament(tournamentId: string, classifierId: string): Promise<void> {
  const res = await fetch(`/api/tournaments/${tournamentId}/classifiers/${classifierId}`, { method: "DELETE" });
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, "Nie udało się usunąć klasyfikatora z turnieju");
    throw new Error(msg);
  }
}

/** POST /api/tournaments/:tournamentId/referee-plan */
export async function createTournamentRefereePlanEntry(
  tournamentId: string,
  body: TournamentRefereePlanPayload
): Promise<RefereePlanMatch> {
  const res = await fetch(`/api/tournaments/${tournamentId}/referee-plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, "Nie udało się utworzyć wpisu w planie sędziów");
    throw new Error(msg);
  }
  return res.json() as Promise<RefereePlanMatch>;
}

/** PUT /api/tournaments/:tournamentId/referee-plan/:matchId */
export async function updateTournamentRefereePlanEntry(
  tournamentId: string,
  matchId: string,
  body: TournamentRefereePlanPayload
): Promise<RefereePlanMatch> {
  const res = await fetch(`/api/tournaments/${tournamentId}/referee-plan/${matchId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, "Nie udało się zapisać wpisu w planie sędziów");
    throw new Error(msg);
  }
  return res.json() as Promise<RefereePlanMatch>;
}

/** GET /api/tournaments/:tournamentId/classifier-plan */
export async function fetchTournamentClassifierPlan(
  tournamentId: string,
  signal?: AbortSignal
): Promise<ClassifierPlanEntry[]> {
  const res = await fetch(`/api/tournaments/${tournamentId}/classifier-plan`, { signal });
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, "Nie udało się pobrać planu klasyfikatorów");
    throw new Error(msg);
  }
  return res.json() as Promise<ClassifierPlanEntry[]>;
}

/** POST /api/tournaments/:tournamentId/classifier-plan */
export async function createTournamentClassifierPlanEntry(
  tournamentId: string,
  body: TournamentClassifierPlanPayload
): Promise<void> {
  const res = await fetch(`/api/tournaments/${tournamentId}/classifier-plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, "Nie udało się utworzyć wpisu w planie klasyfikatorów");
    throw new Error(msg);
  }
}

/** PUT /api/tournaments/:tournamentId/classifier-plan/:examId */
export async function updateTournamentClassifierPlanEntry(
  tournamentId: string,
  examId: string,
  body: TournamentClassifierPlanPayload
): Promise<void> {
  const res = await fetch(`/api/tournaments/${tournamentId}/classifier-plan/${examId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, "Nie udało się zapisać wpisu w planie klasyfikatorów");
    throw new Error(msg);
  }
}

/** DELETE /api/tournaments/:tournamentId/classifier-plan/:examId */
export async function deleteTournamentClassifierPlanEntry(tournamentId: string, examId: string): Promise<void> {
  const res = await fetch(`/api/tournaments/${tournamentId}/classifier-plan/${examId}`, { method: "DELETE" });
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, "Nie udało się usunąć wpisu z planu klasyfikatorów");
    throw new Error(msg);
  }
}

/** DELETE /api/tournaments/:id */
export async function deleteTournamentById(id: string): Promise<void> {
  const res = await fetch(`/api/tournaments/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const msg = await getErrorMessageFromResponse(res, "Nie udało się usunąć turnieju");
    throw new Error(msg);
  }
}
