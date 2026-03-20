import { useEffect, useState } from "react";
import type { Match, Person, RefereePlanMatch, RefereeRole, Team, Tournament } from "@/types";

export function useTournamentDetailsController(id: string) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [addTeamsOpen, setAddTeamsOpen] = useState(false);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [availableTeamsLoading, setAvailableTeamsLoading] = useState(false);
  const [availableTeamsError, setAvailableTeamsError] = useState<string | null>(null);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [saveTeamsLoading, setSaveTeamsLoading] = useState(false);
  const [saveTeamsError, setSaveTeamsError] = useState<string | null>(null);
  const [teamToRemove, setTeamToRemove] = useState<Team | null>(null);
  const [removeTeamLoading, setRemoveTeamLoading] = useState(false);
  const [removeTeamError, setRemoveTeamError] = useState<string | null>(null);

  const [addRefereesOpen, setAddRefereesOpen] = useState(false);
  const [availableReferees, setAvailableReferees] = useState<Person[]>([]);
  const [availableRefereesLoading, setAvailableRefereesLoading] = useState(false);
  const [availableRefereesError, setAvailableRefereesError] = useState<string | null>(null);
  const [selectedRefereeIds, setSelectedRefereeIds] = useState<string[]>([]);
  const [saveRefereesLoading, setSaveRefereesLoading] = useState(false);
  const [saveRefereesError, setSaveRefereesError] = useState<string | null>(null);
  const [refereeToRemove, setRefereeToRemove] = useState<Person | null>(null);
  const [removeRefereeLoading, setRemoveRefereeLoading] = useState(false);
  const [removeRefereeError, setRemoveRefereeError] = useState<string | null>(null);

  const [addClassifiersOpen, setAddClassifiersOpen] = useState(false);
  const [availableClassifiers, setAvailableClassifiers] = useState<Person[]>([]);
  const [availableClassifiersLoading, setAvailableClassifiersLoading] = useState(false);
  const [availableClassifiersError, setAvailableClassifiersError] = useState<string | null>(null);
  const [selectedClassifierIds, setSelectedClassifierIds] = useState<string[]>([]);
  const [saveClassifiersLoading, setSaveClassifiersLoading] = useState(false);
  const [saveClassifiersError, setSaveClassifiersError] = useState<string | null>(null);
  const [classifierToRemove, setClassifierToRemove] = useState<Person | null>(null);
  const [removeClassifierLoading, setRemoveClassifierLoading] = useState(false);
  const [removeClassifierError, setRemoveClassifierError] = useState<string | null>(null);

  // Matches / schedule
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);

  // Referee plan (assignments per match)
  const [refereePlanByMatchId, setRefereePlanByMatchId] = useState<
    Record<string, Partial<Record<RefereeRole, string>>>
  >({});
  const [refereePlanLoading, setRefereePlanLoading] = useState(false);
  const [refereePlanError, setRefereePlanError] = useState<string | null>(null);

  // UI-only: pozwala tworzyć "pustą" tabelę dla dnia zanim pojawią się mecze.
  const [scheduleDayTimestamps, setScheduleDayTimestamps] = useState<number[]>([]);

  // Walidacja dla flow "Nowy dzień"
  const [allowedNewDayTimestamps, setAllowedNewDayTimestamps] = useState<number[] | null>(null);
  const [allowedNewRefereePlanDayTimestamps, setAllowedNewRefereePlanDayTimestamps] = useState<number[] | null>(null);

  const [addMatchOpen, setAddMatchOpen] = useState(false);
  const [createMatchLoading, setCreateMatchLoading] = useState(false);
  const [createMatchError, setCreateMatchError] = useState<string | null>(null);

  const [newMatchDayTimestamp, setNewMatchDayTimestamp] = useState<number | null>(null);
  const [newMatchTeamAId, setNewMatchTeamAId] = useState<string>("");
  const [newMatchTeamBId, setNewMatchTeamBId] = useState<string>("");
  const [newMatchStartTime, setNewMatchStartTime] = useState<string>("10:00");
  const [newMatchEndTime, setNewMatchEndTime] = useState<string>("11:00");
  const [newMatchCourt, setNewMatchCourt] = useState<string>("1");
  const [newMatchScoreA, setNewMatchScoreA] = useState<string>("");
  const [newMatchScoreB, setNewMatchScoreB] = useState<string>("");
  const [newMatchJerseyA, setNewMatchJerseyA] = useState<"jasne" | "ciemne">("jasne");
  const [newMatchJerseyB, setNewMatchJerseyB] = useState<"jasne" | "ciemne">("ciemne");

  const [editMatchOpen, setEditMatchOpen] = useState(false);
  const [editMatch, setEditMatch] = useState<Match | null>(null);
  const [editMatchLoading, setEditMatchLoading] = useState(false);
  const [editMatchError, setEditMatchError] = useState<string | null>(null);

  interface MatchDraft {
    id?: string;
    teamAId: string;
    teamBId: string;
    startTime: string;
    endTime: string;
    scoreA: string;
    scoreB: string;
    court: string;
    jerseyA: "jasne" | "ciemne";
    jerseyB: "jasne" | "ciemne";
  }

  const [editMatchDayTimestamp, setEditMatchDayTimestamp] = useState<number | null>(null);
  const [editMatchDrafts, setEditMatchDrafts] = useState<MatchDraft[]>([]);

  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);
  const [deleteMatchLoading, setDeleteMatchLoading] = useState(false);
  const [deleteMatchError, setDeleteMatchError] = useState<string | null>(null);

  const [matchDayToDelete, setMatchDayToDelete] = useState<number | null>(null);
  const [deleteMatchDayLoading, setDeleteMatchDayLoading] = useState(false);
  const [deleteMatchDayError, setDeleteMatchDayError] = useState<string | null>(null);

  // Referee plan dialogs
  const [addRefereePlanOpen, setAddRefereePlanOpen] = useState(false);
  const [createRefereePlanLoading, setCreateRefereePlanLoading] = useState(false);
  const [createRefereePlanError, setCreateRefereePlanError] = useState<string | null>(null);

  const [newRefereePlanDayTimestamp, setNewRefereePlanDayTimestamp] = useState<number | null>(null);
  const [newRefereePlanTeamAId, setNewRefereePlanTeamAId] = useState<string>("");
  const [newRefereePlanTeamBId, setNewRefereePlanTeamBId] = useState<string>("");
  const [newRefereePlanStartTime, setNewRefereePlanStartTime] = useState<string>("10:00");
  const [newRefereePlanEndTime, setNewRefereePlanEndTime] = useState<string>("11:00");
  const [newRefereePlanCourt, setNewRefereePlanCourt] = useState<string>("1");
  const [newRefereePlanReferee1Id, setNewRefereePlanReferee1Id] = useState<string>("");
  const [newRefereePlanReferee2Id, setNewRefereePlanReferee2Id] = useState<string>("");
  const [newRefereePlanTablePenaltyId, setNewRefereePlanTablePenaltyId] = useState<string>("");
  const [newRefereePlanTableClockId, setNewRefereePlanTableClockId] = useState<string>("");

  interface RefereePlanDraft {
    id?: string;
    teamAId: string;
    teamBId: string;
    startTime: string;
    endTime: string;
    court: string;
    referee1Id: string;
    referee2Id: string;
    tablePenaltyId: string;
    tableClockId: string;
  }

  const [editRefereePlanOpen, setEditRefereePlanOpen] = useState(false);
  const [editRefereePlanDayTimestamp, setEditRefereePlanDayTimestamp] = useState<number | null>(null);
  const [editRefereePlanLoading, setEditRefereePlanLoading] = useState(false);
  const [editRefereePlanError, setEditRefereePlanError] = useState<string | null>(null);
  const [editRefereePlanDrafts, setEditRefereePlanDrafts] = useState<RefereePlanDraft[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadTournament() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/tournaments/${id}`, { signal: controller.signal });
        if (res.status === 404) {
          setTournament(null);
          return;
        }
        if (!res.ok) throw new Error("Nie udało się pobrać turnieju");

        const data: Tournament = await res.json();
        setTournament(data);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Wystąpił błąd podczas pobierania turnieju");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadTournament();
    return () => controller.abort();
  }, [id]);

  async function refreshTournament(nextTournamentId: string) {
    const refreshed = await fetch(`/api/tournaments/${nextTournamentId}`);
    if (refreshed.status === 404) {
      setTournament(null);
      return;
    }
    if (!refreshed.ok) throw new Error("Nie udało się odświeżyć turnieju");
    const updated: Tournament = await refreshed.json();
    setTournament(updated);
  }

  async function refreshMatches(tournamentId: string) {
    setMatchesLoading(true);
    setMatchesError(null);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/matches`);
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Nie udało się pobrać meczów");
      }
      const list: Match[] = await res.json();
      setMatches(list);
    } catch (e) {
      setMatchesError(e instanceof Error ? e.message : "Nie udało się pobrać meczów");
      setMatches([]);
    } finally {
      setMatchesLoading(false);
    }
  }

  async function refreshRefereePlan(tournamentId: string) {
    setRefereePlanLoading(true);
    setRefereePlanError(null);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/referee-plan`);
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Nie udało się pobrać planu sędziów");
      }

      const list: RefereePlanMatch[] = await res.json();
      const mapping: Record<string, Partial<Record<RefereeRole, string>>> = {};
      for (const row of list) {
        mapping[row.matchId] = row.refereeAssignments;
      }
      setRefereePlanByMatchId(mapping);
    } catch (e) {
      setRefereePlanError(e instanceof Error ? e.message : "Nie udało się pobrać planu sędziów");
      setRefereePlanByMatchId({});
    } finally {
      setRefereePlanLoading(false);
    }
  }

  const tournamentId = tournament?.id;
  useEffect(() => {
    if (!tournamentId) return;
    setScheduleDayTimestamps([]);
    void refreshMatches(tournamentId);
    void refreshRefereePlan(tournamentId);
  }, [tournamentId]);

  async function openAddTeamsDialog() {
    if (!tournament) return;

    setAddTeamsOpen(true);
    setAvailableTeamsError(null);
    setSaveTeamsError(null);
    // Pre-select teams already assigned to the tournament.
    setSelectedTeamIds(tournament.teams.map((t) => t.id));

    if (availableTeamsLoading) return;
    if (availableTeams.length > 0) return;

    setAvailableTeamsLoading(true);
    try {
      const res = await fetch(`/api/teams?seasonId=${encodeURIComponent(tournament.seasonId)}`);
      if (!res.ok) throw new Error("Nie udało się pobrać drużyn");
      const teams: Team[] = await res.json();
      setAvailableTeams(teams);
    } catch (e) {
      setAvailableTeamsError(e instanceof Error ? e.message : "Nie udało się pobrać drużyn");
    } finally {
      setAvailableTeamsLoading(false);
    }
  }

  function closeAddTeamsDialog() {
    if (saveTeamsLoading) return;
    setAddTeamsOpen(false);
    setSaveTeamsError(null);
  }

  function toggleSelected(teamId: string) {
    setSelectedTeamIds((prev) => (prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]));
  }

  async function saveSelectedTeams() {
    if (!tournament) return;
    if (selectedTeamIds.length === 0) {
      setSaveTeamsError("Wybierz przynajmniej jedną drużynę");
      return;
    }

    setSaveTeamsLoading(true);
    setSaveTeamsError(null);
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamIds: selectedTeamIds }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Nie udało się dodać drużyn");
      }

      await refreshTournament(tournament.id);
      setAddTeamsOpen(false);
    } catch (e) {
      setSaveTeamsError(e instanceof Error ? e.message : "Nie udało się dodać drużyn");
    } finally {
      setSaveTeamsLoading(false);
    }
  }

  function openRemoveTeamDialog(team: Team) {
    setRemoveTeamError(null);
    setTeamToRemove(team);
  }

  function closeRemoveTeamDialog() {
    if (removeTeamLoading) return;
    setTeamToRemove(null);
    setRemoveTeamError(null);
  }

  async function confirmRemoveTeam() {
    if (!tournament || !teamToRemove) return;

    setRemoveTeamLoading(true);
    setRemoveTeamError(null);
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/teams/${teamToRemove.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Nie udało się usunąć drużyny z turnieju");
      }

      await refreshTournament(tournament.id);
      setTeamToRemove(null);
    } catch (e) {
      setRemoveTeamError(e instanceof Error ? e.message : "Nie udało się usunąć drużyny z turnieju");
    } finally {
      setRemoveTeamLoading(false);
    }
  }

  async function openAddRefereesDialog() {
    if (!tournament) return;
    setAddRefereesOpen(true);
    setAvailableRefereesError(null);
    setSaveRefereesError(null);
    setSelectedRefereeIds(tournament.referees.map((r) => r.id));
    if (availableRefereesLoading || availableReferees.length > 0) return;

    setAvailableRefereesLoading(true);
    try {
      const res = await fetch(`/api/referees?seasonId=${encodeURIComponent(tournament.seasonId)}`);
      if (!res.ok) throw new Error("Nie udało się pobrać sędziów");
      const list: Person[] = await res.json();
      setAvailableReferees(list);
    } catch (e) {
      setAvailableRefereesError(e instanceof Error ? e.message : "Nie udało się pobrać sędziów");
    } finally {
      setAvailableRefereesLoading(false);
    }
  }

  function closeAddRefereesDialog() {
    if (saveRefereesLoading) return;
    setAddRefereesOpen(false);
    setSaveRefereesError(null);
  }

  function toggleSelectedReferee(refereeId: string) {
    setSelectedRefereeIds((prev) =>
      prev.includes(refereeId) ? prev.filter((id) => id !== refereeId) : [...prev, refereeId]
    );
  }

  async function saveSelectedReferees() {
    if (!tournament) return;
    if (selectedRefereeIds.length === 0) {
      setSaveRefereesError("Wybierz przynajmniej jednego sędziego");
      return;
    }
    setSaveRefereesLoading(true);
    setSaveRefereesError(null);
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/referees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refereeIds: selectedRefereeIds }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Nie udało się dodać sędziów");
      }
      await refreshTournament(tournament.id);
      setAddRefereesOpen(false);
    } catch (e) {
      setSaveRefereesError(e instanceof Error ? e.message : "Nie udało się dodać sędziów");
    } finally {
      setSaveRefereesLoading(false);
    }
  }

  function openRemoveRefereeDialog(person: Person) {
    setRemoveRefereeError(null);
    setRefereeToRemove(person);
  }

  function closeRemoveRefereeDialog() {
    if (removeRefereeLoading) return;
    setRefereeToRemove(null);
    setRemoveRefereeError(null);
  }

  async function confirmRemoveReferee() {
    if (!tournament || !refereeToRemove) return;

    setRemoveRefereeLoading(true);
    setRemoveRefereeError(null);
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/referees/${refereeToRemove.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Nie udało się usunąć sędziego z turnieju");
      }
      await refreshTournament(tournament.id);
      setRefereeToRemove(null);
    } catch (e) {
      setRemoveRefereeError(e instanceof Error ? e.message : "Nie udało się usunąć sędziego z turnieju");
    } finally {
      setRemoveRefereeLoading(false);
    }
  }

  async function openAddClassifiersDialog() {
    if (!tournament) return;
    setAddClassifiersOpen(true);
    setAvailableClassifiersError(null);
    setSaveClassifiersError(null);
    setSelectedClassifierIds(tournament.classifiers.map((c) => c.id));
    if (availableClassifiersLoading || availableClassifiers.length > 0) return;

    setAvailableClassifiersLoading(true);
    try {
      const res = await fetch(`/api/classifiers?seasonId=${encodeURIComponent(tournament.seasonId)}`);
      if (!res.ok) throw new Error("Nie udało się pobrać klasyfikatorów");
      const list: Person[] = await res.json();
      setAvailableClassifiers(list);
    } catch (e) {
      setAvailableClassifiersError(e instanceof Error ? e.message : "Nie udało się pobrać klasyfikatorów");
    } finally {
      setAvailableClassifiersLoading(false);
    }
  }

  function closeAddClassifiersDialog() {
    if (saveClassifiersLoading) return;
    setAddClassifiersOpen(false);
    setSaveClassifiersError(null);
  }

  function toggleSelectedClassifier(classifierId: string) {
    setSelectedClassifierIds((prev) =>
      prev.includes(classifierId) ? prev.filter((id) => id !== classifierId) : [...prev, classifierId]
    );
  }

  async function saveSelectedClassifiers() {
    if (!tournament) return;
    if (selectedClassifierIds.length === 0) {
      setSaveClassifiersError("Wybierz przynajmniej jednego klasyfikatora");
      return;
    }

    setSaveClassifiersLoading(true);
    setSaveClassifiersError(null);
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/classifiers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classifierIds: selectedClassifierIds }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Nie udało się dodać klasyfikatorów");
      }
      await refreshTournament(tournament.id);
      setAddClassifiersOpen(false);
    } catch (e) {
      setSaveClassifiersError(e instanceof Error ? e.message : "Nie udało się dodać klasyfikatorów");
    } finally {
      setSaveClassifiersLoading(false);
    }
  }

  function openRemoveClassifierDialog(person: Person) {
    setRemoveClassifierError(null);
    setClassifierToRemove(person);
  }

  function closeRemoveClassifierDialog() {
    if (removeClassifierLoading) return;
    setClassifierToRemove(null);
    setRemoveClassifierError(null);
  }

  async function confirmRemoveClassifier() {
    if (!tournament || !classifierToRemove) return;

    setRemoveClassifierLoading(true);
    setRemoveClassifierError(null);
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/classifiers/${classifierToRemove.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Nie udało się usunąć klasyfikatora z turnieju");
      }
      await refreshTournament(tournament.id);
      setClassifierToRemove(null);
    } catch (e) {
      setRemoveClassifierError(e instanceof Error ? e.message : "Nie udało się usunąć klasyfikatora z turnieju");
    } finally {
      setRemoveClassifierLoading(false);
    }
  }

  const personDisplayName = (p: Person) => `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || "—";

  function formatDateRange(start: string, end?: string) {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : null;

    if (Number.isNaN(startDate.getTime())) {
      return end && !Number.isNaN(endDate?.getTime() ?? NaN) ? (endDate?.toLocaleDateString("pl-PL") ?? "") : "";
    }

    if (!endDate || Number.isNaN(endDate.getTime())) return startDate.toLocaleDateString("pl-PL");

    return `${startDate.toLocaleDateString("pl-PL")} - ${endDate.toLocaleDateString("pl-PL")}`;
  }

  function buildMatchDayOptions(startIso: string, endIso?: string) {
    const startDate = new Date(startIso);
    const endDate = endIso ? new Date(endIso) : startDate;
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return [];

    const first = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const last = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    const formatter = new Intl.DateTimeFormat("pl-PL", { weekday: "long" });
    const options: { timestamp: number; label: string }[] = [];

    const cur = new Date(first);
    while (cur <= last) {
      const label = `${formatter.format(cur)} (${cur.toLocaleDateString("pl-PL")})`;
      options.push({ timestamp: cur.getTime(), label });
      cur.setDate(cur.getDate() + 1);
    }

    return options;
  }

  const matchDayOptions = tournament ? buildMatchDayOptions(tournament.startDate, tournament.endDate) : [];

  function pad2(n: number) {
    return String(n).padStart(2, "0");
  }

  function timeToMinutes(time: string) {
    const [hourRaw, minuteRaw] = time.split(":");
    const hour = Number(hourRaw);
    const minute = Number(minuteRaw);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
    return hour * 60 + minute;
  }

  function openAddMatchDialog(presetDayTimestamp?: number | null, allowedDays?: number[] | null) {
    if (!tournament) return;
    setAddMatchOpen(true);
    setCreateMatchError(null);
    setCreateMatchLoading(false);

    setNewMatchDayTimestamp(presetDayTimestamp ?? matchDayOptions[0]?.timestamp ?? null);
    setAllowedNewDayTimestamps(allowedDays ?? null);

    const [teamA, teamB] = tournament.teams;
    setNewMatchTeamAId(teamA?.id ?? "");
    setNewMatchTeamBId(teamB?.id ?? "");

    setNewMatchStartTime("10:00");
    setNewMatchEndTime("11:00");
    setNewMatchCourt("1");
    setNewMatchScoreA("");
    setNewMatchScoreB("");
    setNewMatchJerseyA("jasne");
    setNewMatchJerseyB("ciemne");
  }

  function closeAddMatchDialog() {
    if (createMatchLoading) return;
    setAddMatchOpen(false);
    setCreateMatchError(null);
    setAllowedNewDayTimestamps(null);
  }

  async function submitNewMatch() {
    if (!tournament) return;
    if (!newMatchDayTimestamp) {
      setCreateMatchError("Wybierz dzień tygodnia");
      return;
    }
    if (allowedNewDayTimestamps && !allowedNewDayTimestamps.includes(newMatchDayTimestamp)) {
      setCreateMatchError("Wybierz wolny dzień (bez zaplanowanych meczów).");
      return;
    }
    if (!newMatchTeamAId || !newMatchTeamBId) {
      setCreateMatchError("Wybierz drużyny A i B");
      return;
    }
    if (newMatchTeamAId === newMatchTeamBId) {
      setCreateMatchError("Drużyny A i B muszą być różne");
      return;
    }

    const [hourRaw, minuteRaw] = newMatchStartTime.split(":");
    const hour = Number(hourRaw);
    const minute = Number(minuteRaw);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
      setCreateMatchError("Podaj poprawną godzinę");
      return;
    }

    const startMinutes = hour * 60 + minute;
    const endMinutes = timeToMinutes(newMatchEndTime);
    const minMinutes = 7 * 60;
    const maxMinutes = 22 * 60;

    if (startMinutes < minMinutes || startMinutes > maxMinutes) {
      setCreateMatchError("Start musi być w przedziale 07:00-22:00");
      return;
    }
    if (endMinutes == null) {
      setCreateMatchError("Podaj poprawny Koniec");
      return;
    }
    if (endMinutes < minMinutes || endMinutes > maxMinutes) {
      setCreateMatchError("Koniec musi być w przedziale 07:00-22:00");
      return;
    }
    if (endMinutes <= startMinutes) {
      setCreateMatchError("Koniec musi być po Start");
      return;
    }

    const day = new Date(newMatchDayTimestamp);
    const scheduledAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute, 0, 0).toISOString();

    const scoreA = newMatchScoreA.trim() === "" ? undefined : Number(newMatchScoreA);
    const scoreB = newMatchScoreB.trim() === "" ? undefined : Number(newMatchScoreB);
    if (
      (scoreA !== undefined && (!Number.isFinite(scoreA) || !Number.isInteger(scoreA) || scoreA < 0 || scoreA > 99)) ||
      (scoreB !== undefined && (!Number.isFinite(scoreB) || !Number.isInteger(scoreB) || scoreB < 0 || scoreB > 99))
    ) {
      setCreateMatchError("Wynik musi być w zakresie 0-99");
      return;
    }

    const court = newMatchCourt.trim() === "" ? undefined : newMatchCourt.trim();
    const jerseyInfo = `Team A: ${newMatchJerseyA}, Team B: ${newMatchJerseyB}`;

    setCreateMatchLoading(true);
    setCreateMatchError(null);
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/matches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamAId: newMatchTeamAId,
          teamBId: newMatchTeamBId,
          scheduledAt,
          court,
          jerseyInfo,
          scoreA,
          scoreB,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Nie udało się utworzyć meczu");
      }

      await refreshMatches(tournament.id);
      await refreshRefereePlan(tournament.id);
      setAddMatchOpen(false);
    } catch (e) {
      setCreateMatchError(e instanceof Error ? e.message : "Nie udało się utworzyć meczu");
    } finally {
      setCreateMatchLoading(false);
    }
  }

  function parseJerseyInfo(jerseyInfo?: string) {
    const fallbackA: "jasne" | "ciemne" = "jasne";
    const fallbackB: "jasne" | "ciemne" = "ciemne";
    if (!jerseyInfo) return { teamA: fallbackA, teamB: fallbackB };

    const normalized = jerseyInfo.toLowerCase();
    const tokenToValue = (token?: string): "jasne" | "ciemne" | undefined => {
      if (!token) return undefined;
      const t = token.toLowerCase();
      if (t === "jasne" || t === "jasny") return "jasne";
      if (t === "ciemne" || t === "ciemny") return "ciemne";
      return undefined;
    };

    const aToken = normalized.match(/team a:\s*(jasne|jasny|ciemne|ciemny)/)?.[1] as string | undefined;
    const bToken = normalized.match(/team b:\s*(jasne|jasny|ciemne|ciemny)/)?.[1] as string | undefined;

    return {
      teamA: tokenToValue(aToken) ?? fallbackA,
      teamB: tokenToValue(bToken) ?? fallbackB,
    };
  }

  function jerseyValueToNounLabel(value: "jasne" | "ciemne") {
    return value === "jasne" ? "Jasne" : "Ciemne";
  }

  function openAddRefereePlanDialog(presetDayTimestamp?: number | null, allowedDays?: number[] | null) {
    if (!tournament) return;
    setAddRefereePlanOpen(true);
    setCreateRefereePlanError(null);
    setCreateRefereePlanLoading(false);

    setNewRefereePlanDayTimestamp(presetDayTimestamp ?? matchDayOptions[0]?.timestamp ?? null);
    setAllowedNewRefereePlanDayTimestamps(allowedDays ?? null);

    const [teamA, teamB] = tournament.teams;
    setNewRefereePlanTeamAId(teamA?.id ?? "");
    setNewRefereePlanTeamBId(teamB?.id ?? "");

    setNewRefereePlanStartTime("10:00");
    setNewRefereePlanEndTime("11:00");
    setNewRefereePlanCourt("1");

    const referees = tournament.referees;
    setNewRefereePlanReferee1Id(referees[0]?.id ?? "");
    setNewRefereePlanReferee2Id(referees[1]?.id ?? "");
    setNewRefereePlanTablePenaltyId(referees[2]?.id ?? "");
    setNewRefereePlanTableClockId(referees[3]?.id ?? "");
  }

  function closeAddRefereePlanDialog() {
    if (createRefereePlanLoading) return;
    setAddRefereePlanOpen(false);
    setCreateRefereePlanError(null);
    setAllowedNewRefereePlanDayTimestamps(null);
  }

  async function submitNewRefereePlan() {
    if (!tournament) return;
    if (!newRefereePlanDayTimestamp) {
      setCreateRefereePlanError("Wybierz dzień tygodnia");
      return;
    }
    if (
      allowedNewRefereePlanDayTimestamps &&
      !allowedNewRefereePlanDayTimestamps.includes(newRefereePlanDayTimestamp)
    ) {
      setCreateRefereePlanError("Wybierz wolny dzień (bez zaplanowanych meczów).");
      return;
    }
    if (!newRefereePlanTeamAId || !newRefereePlanTeamBId) {
      setCreateRefereePlanError("Wybierz drużyny A i B");
      return;
    }
    if (newRefereePlanTeamAId === newRefereePlanTeamBId) {
      setCreateRefereePlanError("Drużyny A i B muszą być różne");
      return;
    }

    const [hourRaw, minuteRaw] = newRefereePlanStartTime.split(":");
    const hour = Number(hourRaw);
    const minute = Number(minuteRaw);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
      setCreateRefereePlanError("Podaj poprawną godzinę");
      return;
    }

    const startMinutes = hour * 60 + minute;
    const endMinutes = timeToMinutes(newRefereePlanEndTime);
    const minMinutes = 7 * 60;
    const maxMinutes = 22 * 60;

    if (startMinutes < minMinutes || startMinutes > maxMinutes) {
      setCreateRefereePlanError("Start musi być w przedziale 07:00-22:00");
      return;
    }
    if (endMinutes == null) {
      setCreateRefereePlanError("Podaj poprawny Koniec");
      return;
    }
    if (endMinutes < minMinutes || endMinutes > maxMinutes) {
      setCreateRefereePlanError("Koniec musi być w przedziale 07:00-22:00");
      return;
    }
    if (endMinutes <= startMinutes) {
      setCreateRefereePlanError("Koniec musi być po Start");
      return;
    }

    const day = new Date(newRefereePlanDayTimestamp);
    const scheduledAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute, 0, 0).toISOString();

    const court = newRefereePlanCourt.trim() === "" ? undefined : newRefereePlanCourt.trim();
    const referee1Id = newRefereePlanReferee1Id.trim() === "" ? undefined : newRefereePlanReferee1Id.trim();
    const referee2Id = newRefereePlanReferee2Id.trim() === "" ? undefined : newRefereePlanReferee2Id.trim();
    const tablePenaltyId = newRefereePlanTablePenaltyId.trim() === "" ? undefined : newRefereePlanTablePenaltyId.trim();
    const tableClockId = newRefereePlanTableClockId.trim() === "" ? undefined : newRefereePlanTableClockId.trim();

    setCreateRefereePlanLoading(true);
    setCreateRefereePlanError(null);
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/referee-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamAId: newRefereePlanTeamAId,
          teamBId: newRefereePlanTeamBId,
          scheduledAt,
          court,
          referee1Id,
          referee2Id,
          tablePenaltyId,
          tableClockId,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Nie udało się utworzyć wpisu w planie sędziów");
      }

      await refreshMatches(tournament.id);
      await refreshRefereePlan(tournament.id);
      setAddRefereePlanOpen(false);
    } catch (e) {
      setCreateRefereePlanError(e instanceof Error ? e.message : "Nie udało się utworzyć wpisu w planie sędziów");
    } finally {
      setCreateRefereePlanLoading(false);
    }
  }

  function openEditRefereePlanDialog(matchesToEdit: Match[]) {
    if (!tournament) return;
    if (matchesToEdit.length === 0) return;

    setEditRefereePlanError(null);
    setEditRefereePlanLoading(false);

    const first = matchesToEdit[0];
    const d = new Date(first.scheduledAt);
    if (!Number.isNaN(d.getTime())) {
      setEditRefereePlanDayTimestamp(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime());
    } else {
      setEditRefereePlanDayTimestamp(null);
    }

    setEditRefereePlanDrafts(
      matchesToEdit.map((match) => {
        const matchDate = new Date(match.scheduledAt);
        const startTime = !Number.isNaN(matchDate.getTime())
          ? `${pad2(matchDate.getHours())}:${pad2(matchDate.getMinutes())}`
          : "10:00";
        const endDate = !Number.isNaN(matchDate.getTime()) ? new Date(matchDate.getTime() + 60 * 60 * 1000) : null;
        const endTime = endDate ? `${pad2(endDate.getHours())}:${pad2(endDate.getMinutes())}` : "11:00";

        const assignments = refereePlanByMatchId[match.id] ?? {};

        return {
          id: match.id,
          teamAId: match.teamAId,
          teamBId: match.teamBId,
          startTime,
          endTime,
          court: match.court ?? "1",
          referee1Id: assignments.REFEREE_1 ?? "",
          referee2Id: assignments.REFEREE_2 ?? "",
          tablePenaltyId: assignments.TABLE_PENALTY ?? "",
          tableClockId: assignments.TABLE_CLOCK ?? "",
        };
      })
    );

    setEditRefereePlanOpen(true);
  }

  function closeEditRefereePlanDialog() {
    if (editRefereePlanLoading) return;
    setEditRefereePlanOpen(false);
    setEditRefereePlanDayTimestamp(null);
    setEditRefereePlanDrafts([]);
    setEditRefereePlanError(null);
  }

  function addAnotherEditRefereePlanRow() {
    if (!tournament) return;
    const teamAId = tournament.teams[0]?.id ?? "";
    const teamBId = tournament.teams.find((t) => t.id !== teamAId)?.id ?? teamAId;
    setEditRefereePlanDrafts((prev) => [
      ...prev,
      {
        teamAId,
        teamBId,
        startTime: "10:00",
        endTime: "11:00",
        court: "1",
        referee1Id: "",
        referee2Id: "",
        tablePenaltyId: "",
        tableClockId: "",
      },
    ]);
  }

  async function submitEditedRefereePlan() {
    if (!tournament) return;
    if (!editRefereePlanDayTimestamp) {
      setEditRefereePlanError("Wybierz dzień tygodnia");
      return;
    }
    if (editRefereePlanDrafts.length === 0) {
      setEditRefereePlanError("Brak pozycji do zapisania");
      return;
    }

    setEditRefereePlanLoading(true);
    setEditRefereePlanError(null);
    try {
      const day = new Date(editRefereePlanDayTimestamp);
      const minMinutes = 7 * 60;
      const maxMinutes = 22 * 60;

      const parsedStartTimes: { hour: number; minute: number }[] = [];
      for (const draft of editRefereePlanDrafts) {
        if (!draft.teamAId || !draft.teamBId) {
          setEditRefereePlanError("Wybierz drużyny A i B");
          return;
        }
        if (draft.teamAId === draft.teamBId) {
          setEditRefereePlanError("Drużyny A i B muszą być różne");
          return;
        }

        const [hourRaw, minuteRaw] = draft.startTime.split(":");
        const hour = Number(hourRaw);
        const minute = Number(minuteRaw);
        if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
          setEditRefereePlanError("Podaj poprawny Start");
          return;
        }

        const startMinutes = hour * 60 + minute;
        const endMinutes = timeToMinutes(draft.endTime);

        if (startMinutes < minMinutes || startMinutes > maxMinutes) {
          setEditRefereePlanError("Start musi być w przedziale 07:00-22:00");
          return;
        }
        if (endMinutes == null) {
          setEditRefereePlanError("Podaj poprawny Koniec");
          return;
        }
        if (endMinutes < minMinutes || endMinutes > maxMinutes) {
          setEditRefereePlanError("Koniec musi być w przedziale 07:00-22:00");
          return;
        }
        if (endMinutes <= startMinutes) {
          setEditRefereePlanError("Koniec musi być po Start");
          return;
        }

        parsedStartTimes.push({ hour, minute });
      }

      for (let i = 0; i < editRefereePlanDrafts.length; i++) {
        const draft = editRefereePlanDrafts[i];
        const parsedStartTime = parsedStartTimes[i];
        if (!parsedStartTime) {
          setEditRefereePlanError("Nie udało się przygotować godziny zapisu");
          return;
        }
        const { hour, minute } = parsedStartTime;

        const scheduledAt = new Date(
          day.getFullYear(),
          day.getMonth(),
          day.getDate(),
          hour,
          minute,
          0,
          0
        ).toISOString();
        const court = draft.court.trim() === "" ? undefined : draft.court.trim();
        const referee1Id = draft.referee1Id.trim() === "" ? undefined : draft.referee1Id.trim();
        const referee2Id = draft.referee2Id.trim() === "" ? undefined : draft.referee2Id.trim();
        const tablePenaltyId = draft.tablePenaltyId.trim() === "" ? undefined : draft.tablePenaltyId.trim();
        const tableClockId = draft.tableClockId.trim() === "" ? undefined : draft.tableClockId.trim();

        const url = draft.id
          ? `/api/tournaments/${tournament.id}/referee-plan/${draft.id}`
          : `/api/tournaments/${tournament.id}/referee-plan`;
        const method = draft.id ? "PUT" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamAId: draft.teamAId,
            teamBId: draft.teamBId,
            scheduledAt,
            court,
            referee1Id,
            referee2Id,
            tablePenaltyId,
            tableClockId,
          }),
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(data?.error || "Nie udało się zapisać wpisu w planie sędziów");
        }
      }

      await refreshMatches(tournament.id);
      await refreshRefereePlan(tournament.id);
      closeEditRefereePlanDialog();
    } catch (e) {
      setEditRefereePlanError(e instanceof Error ? e.message : "Nie udało się zapisać wpisu w planie sędziów");
    } finally {
      setEditRefereePlanLoading(false);
    }
  }

  function openEditMatchDialog(matchesToEdit: Match[]) {
    if (matchesToEdit.length === 0) return;
    setEditMatchError(null);
    setEditMatchLoading(false);
    setEditMatch(matchesToEdit[0]);
    setEditMatchOpen(true);

    const first = matchesToEdit[0];
    const d = new Date(first.scheduledAt);
    if (!Number.isNaN(d.getTime())) {
      setEditMatchDayTimestamp(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime());
    } else {
      setEditMatchDayTimestamp(null);
    }

    setEditMatchDrafts(
      matchesToEdit.map((match) => {
        const matchDate = new Date(match.scheduledAt);
        const { teamA, teamB } = parseJerseyInfo(match.jerseyInfo);

        const startTime = !Number.isNaN(matchDate.getTime())
          ? `${pad2(matchDate.getHours())}:${pad2(matchDate.getMinutes())}`
          : "10:00";
        const endDate = !Number.isNaN(matchDate.getTime()) ? new Date(matchDate.getTime() + 60 * 60 * 1000) : null;
        const endTime = endDate ? `${pad2(endDate.getHours())}:${pad2(endDate.getMinutes())}` : "11:00";

        return {
          id: match.id,
          teamAId: match.teamAId,
          teamBId: match.teamBId,
          startTime,
          endTime,
          court: match.court ?? "1",
          scoreA: match.scoreA != null ? String(match.scoreA) : "",
          scoreB: match.scoreB != null ? String(match.scoreB) : "",
          jerseyA: teamA,
          jerseyB: teamB,
        };
      })
    );
  }

  function closeEditMatchDialog() {
    if (editMatchLoading) return;
    setEditMatchOpen(false);
    setEditMatch(null);
    setEditMatchDrafts([]);
    setEditMatchError(null);
  }

  function addAnotherEditMatchRow() {
    if (!tournament) return;
    const teamAId = tournament.teams[0]?.id ?? "";
    const teamBId = tournament.teams.find((t) => t.id !== teamAId)?.id ?? teamAId;
    setEditMatchDrafts((prev) => [
      ...prev,
      {
        teamAId,
        teamBId,
        startTime: "10:00",
        endTime: "11:00",
        court: "1",
        scoreA: "",
        scoreB: "",
        jerseyA: "jasne",
        jerseyB: "ciemne",
      },
    ]);
  }

  async function submitEditedMatch() {
    if (!tournament || !editMatch) return;
    if (!editMatchDayTimestamp) {
      setEditMatchError("Wybierz dzień tygodnia");
      return;
    }
    if (editMatchDrafts.length === 0) {
      setEditMatchError("Brak meczów do zapisania");
      return;
    }

    const day = new Date(editMatchDayTimestamp);
    setEditMatchLoading(true);
    setEditMatchError(null);
    try {
      for (const draft of editMatchDrafts) {
        if (!draft.teamAId || !draft.teamBId) {
          setEditMatchError("Wybierz drużyny A i B");
          return;
        }
        if (draft.teamAId === draft.teamBId) {
          setEditMatchError("Drużyny A i B muszą być różne");
          return;
        }

        const [hourRaw, minuteRaw] = draft.startTime.split(":");
        const hour = Number(hourRaw);
        const minute = Number(minuteRaw);
        if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
          setEditMatchError("Podaj poprawny Start");
          return;
        }

        const startMinutes = hour * 60 + minute;
        const endMinutes = timeToMinutes(draft.endTime);
        const minMinutes = 7 * 60;
        const maxMinutes = 22 * 60;

        if (startMinutes < minMinutes || startMinutes > maxMinutes) {
          setEditMatchError("Start musi być w przedziale 07:00-22:00");
          return;
        }
        if (endMinutes == null) {
          setEditMatchError("Podaj poprawny Koniec");
          return;
        }
        if (endMinutes < minMinutes || endMinutes > maxMinutes) {
          setEditMatchError("Koniec musi być w przedziale 07:00-22:00");
          return;
        }
        if (endMinutes <= startMinutes) {
          setEditMatchError("Koniec musi być po Start");
          return;
        }

        const scheduledAt = new Date(
          day.getFullYear(),
          day.getMonth(),
          day.getDate(),
          hour,
          minute,
          0,
          0
        ).toISOString();

        const scoreA = draft.scoreA.trim() === "" ? undefined : Number(draft.scoreA);
        const scoreB = draft.scoreB.trim() === "" ? undefined : Number(draft.scoreB);
        if (
          (scoreA !== undefined &&
            (!Number.isFinite(scoreA) || !Number.isInteger(scoreA) || scoreA < 0 || scoreA > 99)) ||
          (scoreB !== undefined && (!Number.isFinite(scoreB) || !Number.isInteger(scoreB) || scoreB < 0 || scoreB > 99))
        ) {
          setEditMatchError("Wynik musi być w zakresie 0-99");
          return;
        }

        const court = draft.court.trim() === "" ? undefined : draft.court.trim();
        const jerseyInfo = `Team A: ${draft.jerseyA}, Team B: ${draft.jerseyB}`;

        const res = await fetch(
          draft.id
            ? `/api/tournaments/${tournament.id}/matches/${draft.id}`
            : `/api/tournaments/${tournament.id}/matches`,
          {
            method: draft.id ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              teamAId: draft.teamAId,
              teamBId: draft.teamBId,
              scheduledAt,
              court,
              jerseyInfo,
              scoreA,
              scoreB,
            }),
          }
        );

        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(
            data?.error || (draft.id ? "Nie udało się zaktualizować meczu" : "Nie udało się utworzyć meczu")
          );
        }
      }

      await refreshMatches(tournament.id);
      await refreshRefereePlan(tournament.id);
      closeEditMatchDialog();
    } catch (e) {
      setEditMatchError(e instanceof Error ? e.message : "Nie udało się zaktualizować meczu");
    } finally {
      setEditMatchLoading(false);
    }
  }

  function closeDeleteMatchDialog() {
    if (deleteMatchLoading) return;
    setMatchToDelete(null);
    setDeleteMatchError(null);
  }

  async function confirmDeleteMatch() {
    if (!tournament || !matchToDelete) return;
    const deletedId = matchToDelete.id;
    setDeleteMatchLoading(true);
    setDeleteMatchError(null);
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/matches/${matchToDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Nie udało się usunąć meczu");
      }

      await refreshMatches(tournament.id);
      await refreshRefereePlan(tournament.id);
      setEditMatchDrafts((prev) => prev.filter((d) => d.id !== deletedId));
      setEditRefereePlanDrafts((prev) => prev.filter((d) => d.id !== deletedId));
      if (editMatch?.id === deletedId) setEditMatch(null);
      setMatchToDelete(null);
    } catch (e) {
      setDeleteMatchError(e instanceof Error ? e.message : "Nie udało się usunąć meczu");
    } finally {
      setDeleteMatchLoading(false);
    }
  }

  function closeDeleteMatchDayDialog() {
    if (deleteMatchDayLoading) return;
    setMatchDayToDelete(null);
    setDeleteMatchDayError(null);
  }

  async function confirmDeleteMatchDay() {
    if (!tournament || matchDayToDelete == null) return;
    setDeleteMatchDayLoading(true);
    setDeleteMatchDayError(null);
    try {
      const dayMatches = matches.filter((m) => getMatchDayTimestamp(m.scheduledAt) === matchDayToDelete);
      for (const m of dayMatches) {
        const res = await fetch(`/api/tournaments/${tournament.id}/matches/${m.id}`, { method: "DELETE" });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(data?.error || "Nie udało się usunąć dnia");
        }
      }

      await refreshMatches(tournament.id);
      await refreshRefereePlan(tournament.id);
      setScheduleDayTimestamps((prev) => prev.filter((ts) => ts !== matchDayToDelete));
      setMatchDayToDelete(null);
    } catch (e) {
      setDeleteMatchDayError(e instanceof Error ? e.message : "Nie udało się usunąć dnia");
    } finally {
      setDeleteMatchDayLoading(false);
    }
  }

  const formatDayOptionLabel = (timestamp: number) => {
    const d = new Date(timestamp);
    const formatter = new Intl.DateTimeFormat("pl-PL", { weekday: "long" });
    return `${formatter.format(d)} (${d.toLocaleDateString("pl-PL")})`;
  };

  const editDayOptions =
    editMatchDayTimestamp != null && !matchDayOptions.some((o) => o.timestamp === editMatchDayTimestamp)
      ? [...matchDayOptions, { timestamp: editMatchDayTimestamp, label: formatDayOptionLabel(editMatchDayTimestamp) }]
      : matchDayOptions;

  const editRefereePlanDayOptions =
    editRefereePlanDayTimestamp != null && !matchDayOptions.some((o) => o.timestamp === editRefereePlanDayTimestamp)
      ? [
          ...matchDayOptions,
          { timestamp: editRefereePlanDayTimestamp, label: formatDayOptionLabel(editRefereePlanDayTimestamp) },
        ]
      : matchDayOptions;

  const getMatchDayTimestamp = (scheduledAtIso: string) => {
    const d = new Date(scheduledAtIso);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  };

  const matchesDayTimestamps = Array.from(new Set(matches.map((m) => getMatchDayTimestamp(m.scheduledAt)))).sort(
    (a, b) => a - b
  );

  const scheduleTableDayTimestamps = Array.from(new Set([...scheduleDayTimestamps, ...matchesDayTimestamps])).sort(
    (a, b) => a - b
  );

  const newMatchDayOptionsForSelect = allowedNewDayTimestamps
    ? matchDayOptions.filter((o) => allowedNewDayTimestamps.includes(o.timestamp))
    : matchDayOptions;

  const newRefereePlanDayOptionsForSelect = allowedNewRefereePlanDayTimestamps
    ? matchDayOptions.filter((o) => allowedNewRefereePlanDayTimestamps.includes(o.timestamp))
    : matchDayOptions;

  function getScheduleDayLabel(timestamp: number) {
    return matchDayOptions.find((o) => o.timestamp === timestamp)?.label ?? formatDayOptionLabel(timestamp);
  }

  function openNewDayTable() {
    if (!tournament) return;
    if (tournament.teams.length < 2) return;

    const used = new Set(scheduleTableDayTimestamps);
    const freeDayOptions = matchDayOptions.filter((o) => !used.has(o.timestamp));
    const nextDay = freeDayOptions[0]?.timestamp ?? null;
    if (!nextDay) return;

    setScheduleDayTimestamps((prev) => {
      const merged = Array.from(new Set([...prev, nextDay]));
      merged.sort((a, b) => a - b);
      return merged;
    });

    openAddMatchDialog(
      nextDay,
      freeDayOptions.map((o) => o.timestamp)
    );
  }

  function openNewDayRefereePlanTable() {
    if (!tournament) return;
    if (tournament.teams.length < 2) return;

    const used = new Set(scheduleTableDayTimestamps);
    const freeDayOptions = matchDayOptions.filter((o) => !used.has(o.timestamp));
    const nextDay = freeDayOptions[0]?.timestamp ?? null;
    if (!nextDay) return;

    setScheduleDayTimestamps((prev) => {
      const merged = Array.from(new Set([...prev, nextDay]));
      merged.sort((a, b) => a - b);
      return merged;
    });

    openAddRefereePlanDialog(
      nextDay,
      freeDayOptions.map((o) => o.timestamp)
    );
  }

  return {
    tournament,
    loading,
    error,

    // Teams dialog
    addTeamsOpen,
    availableTeams,
    availableTeamsLoading,
    availableTeamsError,
    selectedTeamIds,
    saveTeamsLoading,
    saveTeamsError,
    teamToRemove,
    removeTeamLoading,
    removeTeamError,
    openAddTeamsDialog,
    closeAddTeamsDialog,
    toggleSelected,
    saveSelectedTeams,
    openRemoveTeamDialog,
    closeRemoveTeamDialog,
    confirmRemoveTeam,

    // Referees dialog
    addRefereesOpen,
    availableReferees,
    availableRefereesLoading,
    availableRefereesError,
    selectedRefereeIds,
    saveRefereesLoading,
    saveRefereesError,
    refereeToRemove,
    removeRefereeLoading,
    removeRefereeError,
    openAddRefereesDialog,
    closeAddRefereesDialog,
    toggleSelectedReferee,
    saveSelectedReferees,
    openRemoveRefereeDialog,
    closeRemoveRefereeDialog,
    confirmRemoveReferee,

    // Classifiers dialog
    addClassifiersOpen,
    availableClassifiers,
    availableClassifiersLoading,
    availableClassifiersError,
    selectedClassifierIds,
    saveClassifiersLoading,
    saveClassifiersError,
    classifierToRemove,
    removeClassifierLoading,
    removeClassifierError,
    openAddClassifiersDialog,
    closeAddClassifiersDialog,
    toggleSelectedClassifier,
    saveSelectedClassifiers,
    openRemoveClassifierDialog,
    closeRemoveClassifierDialog,
    confirmRemoveClassifier,

    personDisplayName,
    formatDateRange,

    // Matches / referee plan
    matches,
    matchesLoading,
    matchesError,
    refereePlanByMatchId,
    refereePlanLoading,
    refereePlanError,
    scheduleDayTimestamps,
    scheduleTableDayTimestamps,
    getMatchDayTimestamp,
    getScheduleDayLabel,

    // Match add dialog
    addMatchOpen,
    createMatchLoading,
    createMatchError,
    newMatchDayTimestamp,
    setNewMatchDayTimestamp,
    newMatchTeamAId,
    setNewMatchTeamAId,
    newMatchTeamBId,
    setNewMatchTeamBId,
    newMatchStartTime,
    setNewMatchStartTime,
    newMatchEndTime,
    setNewMatchEndTime,
    newMatchCourt,
    setNewMatchCourt,
    newMatchScoreA,
    setNewMatchScoreA,
    newMatchScoreB,
    setNewMatchScoreB,
    newMatchJerseyA,
    setNewMatchJerseyA,
    newMatchJerseyB,
    setNewMatchJerseyB,
    newMatchDayOptionsForSelect,
    openAddMatchDialog,
    closeAddMatchDialog,
    submitNewMatch,

    // Match edit dialog
    editMatchOpen,
    setEditMatchOpen,
    editMatch,
    editMatchLoading,
    editMatchError,
    editMatchDayTimestamp,
    setEditMatchDayTimestamp,
    editMatchDrafts,
    setEditMatchDrafts,
    editDayOptions,
    openEditMatchDialog,
    closeEditMatchDialog,
    addAnotherEditMatchRow,
    submitEditedMatch,

    // Match delete confirmation
    matchToDelete,
    setMatchToDelete,
    deleteMatchLoading,
    deleteMatchError,
    setDeleteMatchError,
    closeDeleteMatchDialog,
    confirmDeleteMatch,

    matchDayToDelete,
    setMatchDayToDelete,
    deleteMatchDayLoading,
    deleteMatchDayError,
    closeDeleteMatchDayDialog,
    confirmDeleteMatchDay,

    // Referee plan add dialog
    addRefereePlanOpen,
    createRefereePlanLoading,
    createRefereePlanError,
    newRefereePlanDayTimestamp,
    setNewRefereePlanDayTimestamp,
    newRefereePlanTeamAId,
    setNewRefereePlanTeamAId,
    newRefereePlanTeamBId,
    setNewRefereePlanTeamBId,
    newRefereePlanStartTime,
    setNewRefereePlanStartTime,
    newRefereePlanEndTime,
    setNewRefereePlanEndTime,
    newRefereePlanCourt,
    setNewRefereePlanCourt,
    newRefereePlanReferee1Id,
    setNewRefereePlanReferee1Id,
    newRefereePlanReferee2Id,
    setNewRefereePlanReferee2Id,
    newRefereePlanTablePenaltyId,
    setNewRefereePlanTablePenaltyId,
    newRefereePlanTableClockId,
    setNewRefereePlanTableClockId,
    newRefereePlanDayOptionsForSelect,
    openAddRefereePlanDialog,
    closeAddRefereePlanDialog,
    submitNewRefereePlan,

    // Referee plan edit dialog
    editRefereePlanOpen,
    setEditRefereePlanOpen,
    editRefereePlanDayTimestamp,
    setEditRefereePlanDayTimestamp,
    editRefereePlanLoading,
    editRefereePlanError,
    editRefereePlanDrafts,
    setEditRefereePlanDrafts,
    editRefereePlanDayOptions,
    openEditRefereePlanDialog,
    closeEditRefereePlanDialog,
    addAnotherEditRefereePlanRow,
    submitEditedRefereePlan,

    // Jersey helpers
    parseJerseyInfo,
    jerseyValueToNounLabel,

    // New day buttons
    openNewDayTable,
    openNewDayRefereePlanTable,
  };
}
