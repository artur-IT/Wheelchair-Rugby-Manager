import { getErrorMessageFromResponse } from "@/lib/apiHttp";
import {
  isTournamentCompleted,
  isTournamentOngoingOrUpcoming,
  sortTournamentsByEndDateDesc,
  sortTournamentsByStartDate,
  totalVolunteersAcrossTournaments,
} from "@/lib/dashboardSeason";
import type { Tournament } from "@/types";

export interface DashboardSeasonData {
  stats: { tournaments: number; teams: number; referees: number; volunteers: number };
  upcoming: Tournament[];
  completed: Tournament[];
  partialWarning: string | null;
}

/**
 * Loads tournaments, teams, and referees for the dashboard and derives season stats.
 * Throws if all three requests fail or on network error; otherwise may set partialWarning.
 */
export async function fetchDashboardSeasonData(seasonId: string, signal?: AbortSignal): Promise<DashboardSeasonData> {
  const [tRes, teamsRes, refRes] = await Promise.all([
    fetch("/api/tournaments", { signal }),
    fetch(`/api/teams?seasonId=${encodeURIComponent(seasonId)}`, { signal }),
    fetch(`/api/referees?seasonId=${encodeURIComponent(seasonId)}`, { signal }),
  ]);

  const failed: string[] = [];
  if (!tRes.ok) failed.push("turniejów");
  if (!teamsRes.ok) failed.push("drużyn");
  if (!refRes.ok) failed.push("sędziów");

  const rawTournaments: unknown = tRes.ok ? await tRes.json().catch(() => []) : [];
  const teamsJson: unknown = teamsRes.ok ? await teamsRes.json().catch(() => []) : [];
  const refereesJson: unknown = refRes.ok ? await refRes.json().catch(() => []) : [];

  if (failed.length === 3) {
    const firstBad = !tRes.ok ? tRes : !teamsRes.ok ? teamsRes : refRes;
    const msg = await getErrorMessageFromResponse(firstBad, "Nie udało się załadować danych pulpitu.");
    throw new Error(msg);
  }

  let partialWarning: string | null = null;
  if (failed.length > 0) {
    partialWarning = `Nie udało się załadować danych: ${failed.join(", ")}. Poniższe liczby mogą być niepełne.`;
  }

  const list = (Array.isArray(rawTournaments) ? rawTournaments : []) as Tournament[];
  const forSeason = list.filter((t) => t.seasonId === seasonId);

  return {
    stats: {
      tournaments: forSeason.length,
      teams: Array.isArray(teamsJson) ? teamsJson.length : 0,
      referees: Array.isArray(refereesJson) ? refereesJson.length : 0,
      volunteers: totalVolunteersAcrossTournaments(forSeason),
    },
    upcoming: sortTournamentsByStartDate(forSeason.filter((t) => isTournamentOngoingOrUpcoming(t))),
    completed: sortTournamentsByEndDateDesc(forSeason.filter((t) => isTournamentCompleted(t))),
    partialWarning,
  };
}
