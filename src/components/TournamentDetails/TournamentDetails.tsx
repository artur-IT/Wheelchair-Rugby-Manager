import { useEffect, useState } from "react";
import { MapPin, Trash2 } from "lucide-react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Link as MuiLink,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  Divider,
  RadioGroup,
  Radio,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import AppShell from "@/components/AppShell/AppShell";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import TournamentHeader from "@/components/TournamentDetails/TournamentHeader";
import TournamentMatchesPlanPanel from "@/components/TournamentDetails/TournamentMatchesPlanPanel";
import TournamentRefereePlanPanel from "@/components/TournamentDetails/TournamentRefereePlanPanel";
import TournamentTeamsPanel from "@/components/TournamentDetails/TournamentTeamsPanel";
import type { Match, Person, RefereePlanMatch, RefereeRole, Team, Tournament } from "@/types";

interface TournamentDetailsProps {
  id: string;
}

export default function TournamentDetails({ id }: TournamentDetailsProps) {
  return (
    <ThemeRegistry>
      <AppShell currentPath="/tournaments">
        <TournamentDetailsContent id={id} />
      </AppShell>
    </ThemeRegistry>
  );
}

function TournamentDetailsContent({ id }: TournamentDetailsProps) {
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

  // UI-only: pozwala tworzyć „pustą” tabelę dla dnia zanim pojawią się mecze.
  const [scheduleDayTimestamps, setScheduleDayTimestamps] = useState<number[]>([]);

  // Walidacja dla flow „Nowy dzień”: użytkownik ma wybierać tylko wolne dni,
  // które nie mają jeszcze zaplanowanych meczów.
  const [allowedNewDayTimestamps, setAllowedNewDayTimestamps] = useState<number[] | null>(null);

  // Analogiczna walidacja dla flow „Nowy dzień” w sekcji sędziów.
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
        if (!res.ok) {
          throw new Error("Nie udało się pobrać turnieju");
        }

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
      const res = await fetch(`/api/tournaments/${tournament.id}/referees/${refereeToRemove.id}`, {
        method: "DELETE",
      });
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

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (!tournament) {
    return <Typography>Nie znaleziono turnieju.</Typography>;
  }

  const formatDateRange = (start: string, end?: string) => {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : null;

    if (Number.isNaN(startDate.getTime())) {
      return end && !Number.isNaN(endDate?.getTime() ?? NaN) ? (endDate?.toLocaleDateString("pl-PL") ?? "") : "";
    }

    if (!endDate || Number.isNaN(endDate.getTime())) {
      return startDate.toLocaleDateString("pl-PL");
    }

    return `${startDate.toLocaleDateString("pl-PL")} - ${endDate.toLocaleDateString("pl-PL")}`;
  };

  const buildMatchDayOptions = (startIso: string, endIso?: string) => {
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
  };

  const matchDayOptions = buildMatchDayOptions(tournament.startDate, tournament.endDate);

  function openAddMatchDialog(presetDayTimestamp?: number | null, allowedDays?: number[] | null) {
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

    // API przechowuje tylko `scheduledAt` (start). `end` jest dla widoku/UX.

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

    // Domyślne przypisania: maks. 4 różne osoby, jeśli są dostępne.
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

      // Najpierw walidujemy wszystkie drafty, aby nie wykonywać żadnych fetchy
      // (czyli unikamy sytuacji, gdzie część wpisów zdąży się zapisać).
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

      // Only after passing validation do we perform fetch for all entries.
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

  /** Noun form for schedule table rows (e.g. "Jasne" / "Ciemne"). */
  function jerseyValueToNounLabel(value: "jasne" | "ciemne") {
    return value === "jasne" ? "Jasne" : "Ciemne";
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
      // Zapisujemy pierwszy (istniejący) mecz jako PUT, a kolejne wiersze jako POST.
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

        // API przechowuje tylko `scheduledAt` (start), ale trzymamy `end` dla UX.
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
      // Jeśli edytujemy plan w tym samym komponencie, usuń wiersz z formularza od razu.
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

      // Usuwamy wszystkie mecze z danego dnia (API wspiera usuwanie pojedynczego meczu).
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

  const venue = tournament.venue;
  const accommodation = tournament.accommodation;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <TournamentHeader id={id} tournament={tournament} formatDateRange={formatDateRange} />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
          gap: 4,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 3,
            }}
          >
            {venue ? (
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: "#dbeafe",
                      p: 1,
                      borderRadius: 2,
                      color: "#2563eb",
                    }}
                  >
                    <MapPin size={20} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    Hala Sportowa
                  </Typography>
                </Box>
                <Typography sx={{ fontWeight: 600 }}>{venue.name}</Typography>
                <Typography color="textSecondary" sx={{ mb: 2 }}>
                  {venue.address}
                </Typography>
                {venue.mapUrl ? (
                  <MuiLink
                    href={venue.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    underline="hover"
                    sx={{ fontWeight: "bold", fontSize: "0.875rem" }}
                  >
                    Otwórz w Mapach &rarr;
                  </MuiLink>
                ) : null}
              </Paper>
            ) : null}

            {accommodation ? (
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: "#d1fae5",
                      p: 1,
                      borderRadius: 2,
                      color: "#059669",
                    }}
                  >
                    <MapPin size={20} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    Zakwaterowanie
                  </Typography>
                </Box>
                <Typography sx={{ fontWeight: 600 }}>{accommodation.name}</Typography>
                <Typography color="textSecondary" sx={{ mb: 2 }}>
                  {accommodation.address}
                </Typography>
                {tournament.parking ? (
                  <Typography sx={{ mb: 2 }}>
                    <strong>Parking:</strong> {tournament.parking}
                  </Typography>
                ) : null}
                {accommodation.mapUrl ? (
                  <MuiLink
                    href={accommodation.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    underline="hover"
                    sx={{ fontWeight: "bold", fontSize: "0.875rem" }}
                  >
                    Otwórz w Mapach &rarr;
                  </MuiLink>
                ) : null}
              </Paper>
            ) : null}

            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    bgcolor: "#fff7ed",
                    p: 1,
                    borderRadius: 2,
                    color: "#d97706",
                  }}
                >
                  <MapPin size={20} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  Wyżywienie
                </Typography>
              </Box>
              {tournament.catering ? (
                <Typography sx={{ fontWeight: 600, whiteSpace: "pre-wrap" }}>{tournament.catering}</Typography>
              ) : (
                <Typography color="textSecondary">Brak danych.</Typography>
              )}
            </Paper>
          </Box>

          <TournamentMatchesPlanPanel
            tournament={tournament}
            matches={matches}
            matchesLoading={matchesLoading}
            matchesError={matchesError}
            scheduleTableDayTimestamps={scheduleTableDayTimestamps}
            parseJerseyInfo={parseJerseyInfo}
            jerseyValueToNounLabel={jerseyValueToNounLabel}
            getMatchDayTimestamp={getMatchDayTimestamp}
            getScheduleDayLabel={getScheduleDayLabel}
            openAddMatchDialog={openAddMatchDialog}
            openNewDayTable={openNewDayTable}
            openEditMatchDialog={openEditMatchDialog}
            setMatchDayToDelete={setMatchDayToDelete}
            deleteMatchDayLoading={deleteMatchDayLoading}
            matchDayToDelete={matchDayToDelete}
          />

          <TournamentRefereePlanPanel
            tournament={tournament}
            matches={matches}
            refereePlanByMatchId={refereePlanByMatchId}
            refereePlanLoading={refereePlanLoading}
            refereePlanError={refereePlanError}
            scheduleTableDayTimestamps={scheduleTableDayTimestamps}
            getMatchDayTimestamp={getMatchDayTimestamp}
            getScheduleDayLabel={getScheduleDayLabel}
            openAddRefereePlanDialog={openAddRefereePlanDialog}
            openNewDayRefereePlanTable={openNewDayRefereePlanTable}
            openEditRefereePlanDialog={openEditRefereePlanDialog}
            personDisplayName={personDisplayName}
            setMatchDayToDelete={setMatchDayToDelete}
            deleteMatchDayLoading={deleteMatchDayLoading}
            matchDayToDelete={matchDayToDelete}
          />
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <TournamentTeamsPanel
            tournament={tournament}
            openAddTeamsDialog={openAddTeamsDialog}
            openRemoveTeamDialog={openRemoveTeamDialog}
            removeTeamLoading={removeTeamLoading}
            teamToRemove={teamToRemove}
          />

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
              Personel
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    color: "text.secondary",
                    mb: 1,
                    display: "block",
                  }}
                >
                  Sędziowie
                  <Typography component="span" aria-hidden="true" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    ({tournament.referees.length})
                  </Typography>
                </Typography>
                {tournament.referees.length === 0 ? (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <Typography variant="body2" color="textSecondary">
                      Brak przypisanych sędziów.
                    </Typography>
                    <Button variant="contained" onClick={openAddRefereesDialog} sx={{ alignSelf: "flex-start" }}>
                      Dodaj
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {tournament.referees.map((r) => (
                      <Box
                        key={r.id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: "grey.50",
                        }}
                      >
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: "white",
                            borderRadius: 1,
                            border: "1px solid",
                            borderColor: "grey.200",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "bold",
                            color: "primary.main",
                          }}
                        >
                          {r.firstName?.[0] ?? "?"}
                        </Box>
                        <Typography sx={{ fontWeight: 500, flex: 1 }}>{personDisplayName(r)}</Typography>
                        <Tooltip title="Usuń sędziego z turnieju">
                          <span>
                            <IconButton
                              aria-label={`Usuń sędziego ${personDisplayName(r)} z turnieju`}
                              color="error"
                              onClick={() => openRemoveRefereeDialog(r)}
                              size="small"
                              disabled={removeRefereeLoading && refereeToRemove?.id === r.id}
                              sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 0 }}
                            >
                              <Trash2 size={18} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    ))}
                    <Button variant="outlined" onClick={openAddRefereesDialog} sx={{ alignSelf: "flex-start" }}>
                      Dodaj
                    </Button>
                  </Box>
                )}
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    color: "text.secondary",
                    mb: 1,
                    display: "block",
                  }}
                >
                  Klasyfikatorzy
                  <Typography component="span" aria-hidden="true" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    ({tournament.classifiers.length})
                  </Typography>
                </Typography>
                {tournament.classifiers.length === 0 ? (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <Typography variant="body2" color="textSecondary">
                      Brak przypisanych klasyfikatorów.
                    </Typography>
                    <Button variant="contained" onClick={openAddClassifiersDialog} sx={{ alignSelf: "flex-start" }}>
                      Dodaj
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {tournament.classifiers.map((c) => (
                      <Box
                        key={c.id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: "grey.50",
                        }}
                      >
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: "white",
                            borderRadius: 1,
                            border: "1px solid",
                            borderColor: "grey.200",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "bold",
                            color: "primary.main",
                          }}
                        >
                          {c.firstName?.[0] ?? "?"}
                        </Box>
                        <Typography sx={{ fontWeight: 500, flex: 1 }}>{personDisplayName(c)}</Typography>
                        <Tooltip title="Usuń klasyfikatora z turnieju">
                          <span>
                            <IconButton
                              aria-label={`Usuń klasyfikatora ${personDisplayName(c)} z turnieju`}
                              color="error"
                              onClick={() => openRemoveClassifierDialog(c)}
                              size="small"
                              disabled={removeClassifierLoading && classifierToRemove?.id === c.id}
                              sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 0 }}
                            >
                              <Trash2 size={18} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    ))}
                    <Button variant="outlined" onClick={openAddClassifiersDialog} sx={{ alignSelf: "flex-start" }}>
                      Dodaj
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>

      <Dialog open={addMatchOpen} onClose={closeAddMatchDialog} fullWidth maxWidth="md">
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Typography component="div" variant="h6" sx={{ fontWeight: 900 }}>
            Tworzenie planu rozgrywek
          </Typography>

          <TextField
            select
            label="Dzień tygodnia"
            value={String(newMatchDayTimestamp ?? "")}
            onChange={(e) => setNewMatchDayTimestamp(Number(e.target.value))}
            size="small"
            sx={{ minWidth: 220 }}
          >
            {newMatchDayOptionsForSelect.map((o) => (
              <MenuItem key={o.timestamp} value={String(o.timestamp)}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        </DialogTitle>

        <DialogContent dividers>
          {createMatchError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {createMatchError}
            </Alert>
          ) : null}

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 2 }}>
            <TextField
              select
              label="Drużyna A"
              value={newMatchTeamAId}
              onChange={(e) => setNewMatchTeamAId(String(e.target.value))}
              fullWidth
              size="small"
            >
              {tournament.teams.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Drużyna B"
              value={newMatchTeamBId}
              onChange={(e) => setNewMatchTeamBId(String(e.target.value))}
              fullWidth
              size="small"
            >
              {tournament.teams.map((t) => (
                <MenuItem key={t.id} value={t.id} disabled={t.id === newMatchTeamAId}>
                  {t.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box
            sx={{
              display: "grid",
              // Pola są krótkie (czasy, liczby), więc na `sm+` dajemy je w jednym wierszu
              // i ograniczamy minimalne szerokości.
              gridTemplateColumns: { xs: "1fr", sm: "120px 120px 95px 95px 95px" },
              gap: 1.5,
              mb: 2,
              alignItems: "end",
            }}
          >
            <TextField
              type="time"
              label="Start"
              value={newMatchStartTime}
              onChange={(e) => setNewMatchStartTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ minWidth: 120 }}
            />

            <TextField
              type="time"
              label="Koniec"
              value={newMatchEndTime}
              onChange={(e) => setNewMatchEndTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ minWidth: 120 }}
            />

            <TextField
              select
              label="Boisko"
              value={newMatchCourt}
              onChange={(e) => setNewMatchCourt(String(e.target.value))}
              size="small"
              sx={{ minWidth: 95 }}
            >
              <MenuItem value="1">1</MenuItem>
              <MenuItem value="2">2</MenuItem>
            </TextField>

            <TextField
              type="number"
              label="Wynik A"
              value={newMatchScoreA}
              onChange={(e) => setNewMatchScoreA(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ minWidth: 95 }}
            />

            <TextField
              type="number"
              label="Wynik B"
              value={newMatchScoreB}
              onChange={(e) => setNewMatchScoreB(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ minWidth: 95 }}
            />
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Typography sx={{ fontWeight: 900, mb: 1, fontSize: 14 }}>Kolory koszulek</Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <Box>
              <Typography color="text.secondary" sx={{ mb: 1, fontSize: 13 }}>
                Drużyna A
              </Typography>
              <RadioGroup
                row
                value={newMatchJerseyA}
                onChange={(e) => {
                  const next = e.target.value as "jasne" | "ciemne";
                  setNewMatchJerseyA(next);
                  setNewMatchJerseyB(next === "jasne" ? "ciemne" : "jasne");
                }}
              >
                <FormControlLabel
                  value="jasne"
                  control={<Radio size="small" />}
                  label="Jasne"
                  sx={{ "& .MuiFormControlLabel-label": { fontSize: 13 } }}
                />
                <FormControlLabel
                  value="ciemne"
                  control={<Radio size="small" />}
                  label="Ciemne"
                  sx={{ "& .MuiFormControlLabel-label": { fontSize: 13 } }}
                />
              </RadioGroup>
            </Box>

            <Box>
              <Typography color="text.secondary" sx={{ mb: 1, fontSize: 13 }}>
                Drużyna B
              </Typography>
              <RadioGroup
                row
                value={newMatchJerseyB}
                onChange={(e) => {
                  const next = e.target.value as "jasne" | "ciemne";
                  setNewMatchJerseyB(next);
                  setNewMatchJerseyA(next === "jasne" ? "ciemne" : "jasne");
                }}
              >
                <FormControlLabel
                  value="jasne"
                  control={<Radio size="small" />}
                  label="Jasne"
                  sx={{ "& .MuiFormControlLabel-label": { fontSize: 13 } }}
                />
                <FormControlLabel
                  value="ciemne"
                  control={<Radio size="small" />}
                  label="Ciemne"
                  sx={{ "& .MuiFormControlLabel-label": { fontSize: 13 } }}
                />
              </RadioGroup>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeAddMatchDialog} disabled={createMatchLoading}>
            Anuluj
          </Button>
          <Button variant="contained" onClick={submitNewMatch} disabled={createMatchLoading}>
            Dodaj
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editMatchOpen} onClose={closeEditMatchDialog} fullWidth maxWidth="md">
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Typography component="div" variant="h6" sx={{ fontWeight: 900 }}>
            Edycja meczu
          </Typography>

          <TextField
            select
            label="Dzień tygodnia"
            value={String(editMatchDayTimestamp ?? "")}
            onChange={(e) => setEditMatchDayTimestamp(Number(e.target.value))}
            size="small"
            sx={{ minWidth: 220 }}
          >
            {editDayOptions.map((o) => (
              <MenuItem key={o.timestamp} value={String(o.timestamp)}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        </DialogTitle>

        <DialogContent dividers>
          {editMatchError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {editMatchError}
            </Alert>
          ) : null}

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small" aria-label="Tabela meczów">
              <TableHead>
                <TableRow>
                  <TableCell align="center" sx={{ width: 48 }} />
                  <TableCell align="center">Drużyna A</TableCell>
                  <TableCell align="center">Wynik A</TableCell>
                  <TableCell align="center">Start</TableCell>
                  <TableCell align="center">Koniec</TableCell>
                  <TableCell align="center">Wynik B</TableCell>
                  <TableCell align="center">Drużyna B</TableCell>
                  <TableCell align="center">Boisko</TableCell>
                  <TableCell align="center">Kolor koszulek</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {editMatchDrafts.map((draft, idx) => (
                  <TableRow key={draft.id ?? `row-${idx}`}>
                    <TableCell
                      align="center"
                      sx={{ width: 48, paddingLeft: 1, paddingRight: 1, verticalAlign: "middle" }}
                    >
                      {(() => {
                        const teamAName = tournament.teams.find((t) => t.id === draft.teamAId)?.name ?? draft.teamAId;
                        const teamBName = tournament.teams.find((t) => t.id === draft.teamBId)?.name ?? draft.teamBId;

                        const canDeleteFromApi = Boolean(draft.id);
                        const disabled = editMatchLoading || (canDeleteFromApi && deleteMatchLoading);

                        return (
                          <Tooltip title="Usuń rozgrywkę">
                            <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
                              <IconButton
                                aria-label={`Usuń rozgrywkę ${teamAName} vs ${teamBName}`}
                                color="error"
                                onClick={() => {
                                  if (disabled) return;

                                  if (!draft.id) {
                                    setEditMatchDrafts((prev) => prev.filter((_, i) => i !== idx));
                                    return;
                                  }

                                  const match = matches.find((m) => m.id === draft.id);
                                  if (!match) {
                                    setEditMatchDrafts((prev) => prev.filter((d) => d.id !== draft.id));
                                    return;
                                  }

                                  setDeleteMatchError(null);
                                  setMatchToDelete(match);
                                  setEditMatchOpen(false);
                                }}
                                size="small"
                                disabled={disabled}
                                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 0 }}
                              >
                                <Trash2 size={18} />
                              </IconButton>
                            </Box>
                          </Tooltip>
                        );
                      })()}
                    </TableCell>
                    <TableCell sx={{ minWidth: 180 }}>
                      <TextField
                        select
                        label="Drużyna A"
                        value={draft.teamAId}
                        onChange={(e) => {
                          const nextTeamAId = String(e.target.value);
                          setEditMatchDrafts((prev) =>
                            prev.map((d, i) => {
                              if (i !== idx) return d;
                              const nextTeamBId =
                                d.teamBId === nextTeamAId
                                  ? (tournament.teams.find((t) => t.id !== nextTeamAId)?.id ?? "")
                                  : d.teamBId;
                              return { ...d, teamAId: nextTeamAId, teamBId: nextTeamBId };
                            })
                          );
                        }}
                        size="small"
                        fullWidth
                      >
                        {tournament.teams.map((t) => (
                          <MenuItem key={t.id} value={t.id}>
                            {t.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>

                    <TableCell sx={{ minWidth: 140 }}>
                      <TextField
                        type="number"
                        label="Wynik A"
                        value={draft.scoreA}
                        onChange={(e) =>
                          setEditMatchDrafts((prev) =>
                            prev.map((d, i) => (i === idx ? { ...d, scoreA: e.target.value } : d))
                          )
                        }
                        InputLabelProps={{ shrink: true }}
                        size="small"
                      />
                    </TableCell>

                    <TableCell sx={{ minWidth: 120 }}>
                      <TextField
                        type="time"
                        label="Start"
                        value={draft.startTime}
                        onChange={(e) =>
                          setEditMatchDrafts((prev) =>
                            prev.map((d, i) => (i === idx ? { ...d, startTime: e.target.value } : d))
                          )
                        }
                        InputLabelProps={{ shrink: true }}
                        size="small"
                      />
                    </TableCell>

                    <TableCell sx={{ minWidth: 120 }}>
                      <TextField
                        type="time"
                        label="Koniec"
                        value={draft.endTime}
                        onChange={(e) =>
                          setEditMatchDrafts((prev) =>
                            prev.map((d, i) => (i === idx ? { ...d, endTime: e.target.value } : d))
                          )
                        }
                        InputLabelProps={{ shrink: true }}
                        size="small"
                      />
                    </TableCell>

                    <TableCell sx={{ minWidth: 140 }}>
                      <TextField
                        type="number"
                        label="Wynik B"
                        value={draft.scoreB}
                        onChange={(e) =>
                          setEditMatchDrafts((prev) =>
                            prev.map((d, i) => (i === idx ? { ...d, scoreB: e.target.value } : d))
                          )
                        }
                        InputLabelProps={{ shrink: true }}
                        size="small"
                      />
                    </TableCell>

                    <TableCell sx={{ minWidth: 180 }}>
                      <TextField
                        select
                        label="Drużyna B"
                        value={draft.teamBId}
                        onChange={(e) =>
                          setEditMatchDrafts((prev) =>
                            prev.map((d, i) => (i === idx ? { ...d, teamBId: String(e.target.value) } : d))
                          )
                        }
                        size="small"
                        fullWidth
                      >
                        {tournament.teams.map((t) => (
                          <MenuItem key={t.id} value={t.id} disabled={t.id === draft.teamAId}>
                            {t.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>

                    <TableCell sx={{ minWidth: 120 }}>
                      <TextField
                        select
                        label="Boisko"
                        value={draft.court}
                        onChange={(e) =>
                          setEditMatchDrafts((prev) =>
                            prev.map((d, i) => (i === idx ? { ...d, court: String(e.target.value) } : d))
                          )
                        }
                        size="small"
                        fullWidth
                      >
                        <MenuItem value="1">1</MenuItem>
                        <MenuItem value="2">2</MenuItem>
                      </TextField>
                    </TableCell>

                    <TableCell sx={{ minWidth: 230, verticalAlign: "middle" }}>
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 1,
                          alignItems: "center",
                        }}
                      >
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            A
                          </Typography>
                          <RadioGroup
                            row
                            value={draft.jerseyA}
                            onChange={(e) => {
                              const next = e.target.value as "jasne" | "ciemne";
                              setEditMatchDrafts((prev) =>
                                prev.map((d, i) =>
                                  i === idx
                                    ? { ...d, jerseyA: next, jerseyB: next === "jasne" ? "ciemne" : "jasne" }
                                    : d
                                )
                              );
                            }}
                          >
                            <FormControlLabel
                              value="jasne"
                              control={<Radio size="small" />}
                              label="Jasne"
                              sx={{ "& .MuiFormControlLabel-label": { fontSize: 12 } }}
                            />
                            <FormControlLabel
                              value="ciemne"
                              control={<Radio size="small" />}
                              label="Ciemne"
                              sx={{ "& .MuiFormControlLabel-label": { fontSize: 12 } }}
                            />
                          </RadioGroup>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            B
                          </Typography>
                          <RadioGroup
                            row
                            value={draft.jerseyB}
                            onChange={(e) => {
                              const next = e.target.value as "jasne" | "ciemne";
                              setEditMatchDrafts((prev) =>
                                prev.map((d, i) =>
                                  i === idx
                                    ? { ...d, jerseyB: next, jerseyA: next === "jasne" ? "ciemne" : "jasne" }
                                    : d
                                )
                              );
                            }}
                          >
                            <FormControlLabel
                              value="jasne"
                              control={<Radio size="small" />}
                              label="Jasne"
                              sx={{ "& .MuiFormControlLabel-label": { fontSize: 12 } }}
                            />
                            <FormControlLabel
                              value="ciemne"
                              control={<Radio size="small" />}
                              label="Ciemne"
                              sx={{ "& .MuiFormControlLabel-label": { fontSize: 12 } }}
                            />
                          </RadioGroup>
                        </Box>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-start" }}>
            <Button variant="outlined" onClick={addAnotherEditMatchRow} disabled={editMatchLoading}>
              Dodaj kolejny mecz
            </Button>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeEditMatchDialog} disabled={editMatchLoading}>
            Anuluj
          </Button>
          <Button
            color="error"
            variant="outlined"
            disabled={editMatchLoading}
            onClick={() => {
              if (!editMatch) return;
              setDeleteMatchError(null);
              setMatchToDelete(editMatch);
              setEditMatchOpen(false);
            }}
          >
            Usuń
          </Button>
          <Button variant="contained" onClick={submitEditedMatch} disabled={editMatchLoading}>
            Zapisz
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={addRefereePlanOpen} onClose={closeAddRefereePlanDialog} fullWidth maxWidth="md">
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Typography component="div" variant="h6" sx={{ fontWeight: 900 }}>
            Tworzenie planu sędziów
          </Typography>

          <TextField
            select
            label="Dzień tygodnia"
            value={String(newRefereePlanDayTimestamp ?? "")}
            onChange={(e) => setNewRefereePlanDayTimestamp(Number(e.target.value))}
            size="small"
            sx={{ minWidth: 220 }}
          >
            {newRefereePlanDayOptionsForSelect.map((o) => (
              <MenuItem key={o.timestamp} value={String(o.timestamp)}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        </DialogTitle>

        <DialogContent dividers>
          {createRefereePlanError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {createRefereePlanError}
            </Alert>
          ) : null}

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 120px 120px 1fr 95px" },
                gap: 1.5,
                alignItems: "end",
              }}
            >
              <TextField
                select
                label="Drużyna A"
                value={newRefereePlanTeamAId}
                onChange={(e) => setNewRefereePlanTeamAId(String(e.target.value))}
                fullWidth
                size="small"
              >
                {tournament.teams.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                type="time"
                label="Start"
                value={newRefereePlanStartTime}
                onChange={(e) => setNewRefereePlanStartTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />

              <TextField
                type="time"
                label="Koniec"
                value={newRefereePlanEndTime}
                onChange={(e) => setNewRefereePlanEndTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />

              <TextField
                select
                label="Drużyna B"
                value={newRefereePlanTeamBId}
                onChange={(e) => setNewRefereePlanTeamBId(String(e.target.value))}
                fullWidth
                size="small"
              >
                {tournament.teams.map((t) => (
                  <MenuItem key={t.id} value={t.id} disabled={t.id === newRefereePlanTeamAId}>
                    {t.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Boisko"
                value={newRefereePlanCourt}
                onChange={(e) => setNewRefereePlanCourt(String(e.target.value))}
                size="small"
              >
                <MenuItem value="1">1</MenuItem>
                <MenuItem value="2">2</MenuItem>
              </TextField>
            </Box>

            <Divider />

            <Typography sx={{ fontWeight: 900, fontSize: 14 }}>Obsada sędziowska</Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr 1fr" },
                gap: 1.5,
              }}
            >
              <TextField
                select
                label="Sędzia 1"
                value={newRefereePlanReferee1Id}
                onChange={(e) => setNewRefereePlanReferee1Id(String(e.target.value))}
                size="small"
              >
                <MenuItem value="">—</MenuItem>
                {tournament.referees.map((r) => (
                  <MenuItem
                    key={r.id}
                    value={r.id}
                    disabled={
                      r.id !== newRefereePlanReferee1Id &&
                      [newRefereePlanReferee2Id, newRefereePlanTablePenaltyId, newRefereePlanTableClockId].includes(
                        r.id
                      )
                    }
                  >
                    {personDisplayName(r)}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Sędzia 2"
                value={newRefereePlanReferee2Id}
                onChange={(e) => setNewRefereePlanReferee2Id(String(e.target.value))}
                size="small"
              >
                <MenuItem value="">—</MenuItem>
                {tournament.referees.map((r) => (
                  <MenuItem
                    key={r.id}
                    value={r.id}
                    disabled={
                      r.id !== newRefereePlanReferee2Id &&
                      [newRefereePlanReferee1Id, newRefereePlanTablePenaltyId, newRefereePlanTableClockId].includes(
                        r.id
                      )
                    }
                  >
                    {personDisplayName(r)}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Stolik kar"
                value={newRefereePlanTablePenaltyId}
                onChange={(e) => setNewRefereePlanTablePenaltyId(String(e.target.value))}
                size="small"
              >
                <MenuItem value="">—</MenuItem>
                {tournament.referees.map((r) => (
                  <MenuItem
                    key={r.id}
                    value={r.id}
                    disabled={
                      r.id !== newRefereePlanTablePenaltyId &&
                      [newRefereePlanReferee1Id, newRefereePlanReferee2Id, newRefereePlanTableClockId].includes(r.id)
                    }
                  >
                    {personDisplayName(r)}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Zagary"
                value={newRefereePlanTableClockId}
                onChange={(e) => setNewRefereePlanTableClockId(String(e.target.value))}
                size="small"
              >
                <MenuItem value="">—</MenuItem>
                {tournament.referees.map((r) => (
                  <MenuItem
                    key={r.id}
                    value={r.id}
                    disabled={
                      r.id !== newRefereePlanTableClockId &&
                      [newRefereePlanReferee1Id, newRefereePlanReferee2Id, newRefereePlanTablePenaltyId].includes(r.id)
                    }
                  >
                    {personDisplayName(r)}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeAddRefereePlanDialog} disabled={createRefereePlanLoading}>
            Anuluj
          </Button>
          <Button variant="contained" onClick={submitNewRefereePlan} disabled={createRefereePlanLoading}>
            Dodaj
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editRefereePlanOpen} onClose={closeEditRefereePlanDialog} fullWidth maxWidth="md">
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Typography component="div" variant="h6" sx={{ fontWeight: 900 }}>
            Edycja planu sędziów
          </Typography>

          <TextField
            select
            label="Dzień tygodnia"
            value={String(editRefereePlanDayTimestamp ?? "")}
            onChange={(e) => setEditRefereePlanDayTimestamp(Number(e.target.value))}
            size="small"
            sx={{ minWidth: 220 }}
          >
            {editRefereePlanDayOptions.map((o) => (
              <MenuItem key={o.timestamp} value={String(o.timestamp)}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        </DialogTitle>

        <DialogContent dividers>
          {editRefereePlanError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {editRefereePlanError}
            </Alert>
          ) : null}

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small" aria-label="Tabela planu sędziów (edycja)">
              <TableHead>
                <TableRow>
                  <TableCell align="center" sx={{ width: 48 }} />
                  <TableCell align="center">Drużyna A</TableCell>
                  <TableCell align="center">Start</TableCell>
                  <TableCell align="center">Koniec</TableCell>
                  <TableCell align="center">Drużyna B</TableCell>
                  <TableCell align="center">Boisko</TableCell>
                  <TableCell align="center">Sędzia 1</TableCell>
                  <TableCell align="center">Sędzia 2</TableCell>
                  <TableCell align="center">Stolik kar</TableCell>
                  <TableCell align="center">Zagary</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {editRefereePlanDrafts.map((draft, idx) => {
                  const teamAName = tournament.teams.find((t) => t.id === draft.teamAId)?.name ?? draft.teamAId;
                  const teamBName = tournament.teams.find((t) => t.id === draft.teamBId)?.name ?? draft.teamBId;

                  return (
                    <TableRow key={draft.id ?? `ref-row-${idx}`}>
                      <TableCell
                        align="center"
                        sx={{ width: 48, paddingLeft: 1, paddingRight: 1, verticalAlign: "middle" }}
                      >
                        <Tooltip title="Usuń pozycję">
                          <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
                            <IconButton
                              aria-label={`Usuń pozycję ${teamAName} vs ${teamBName}`}
                              color="error"
                              onClick={() => {
                                if (editRefereePlanLoading) return;

                                if (!draft.id) {
                                  setEditRefereePlanDrafts((prev) => prev.filter((_, i) => i !== idx));
                                  return;
                                }

                                const match = matches.find((m) => m.id === draft.id);
                                if (!match) {
                                  setEditRefereePlanDrafts((prev) => prev.filter((d) => d.id !== draft.id));
                                  return;
                                }

                                setDeleteMatchError(null);
                                setMatchToDelete(match);
                                setEditRefereePlanOpen(false);
                              }}
                              size="small"
                              disabled={editRefereePlanLoading || (draft.id ? deleteMatchLoading : false)}
                              sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 0 }}
                            >
                              <Trash2 size={18} />
                            </IconButton>
                          </Box>
                        </Tooltip>
                      </TableCell>

                      <TableCell sx={{ minWidth: 180 }}>
                        <TextField
                          select
                          label="Drużyna A"
                          value={draft.teamAId}
                          onChange={(e) => {
                            const nextTeamAId = String(e.target.value);
                            setEditRefereePlanDrafts((prev) =>
                              prev.map((d, i) =>
                                i !== idx
                                  ? d
                                  : {
                                      ...d,
                                      teamAId: nextTeamAId,
                                      teamBId:
                                        d.teamBId === nextTeamAId
                                          ? (tournament.teams.find((t) => t.id !== nextTeamAId)?.id ?? "")
                                          : d.teamBId,
                                    }
                              )
                            );
                          }}
                          size="small"
                          fullWidth
                        >
                          {tournament.teams.map((t) => (
                            <MenuItem key={t.id} value={t.id}>
                              {t.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </TableCell>

                      <TableCell sx={{ minWidth: 120 }}>
                        <TextField
                          type="time"
                          label="Start"
                          value={draft.startTime}
                          onChange={(e) =>
                            setEditRefereePlanDrafts((prev) =>
                              prev.map((d, i) => (i === idx ? { ...d, startTime: e.target.value } : d))
                            )
                          }
                          InputLabelProps={{ shrink: true }}
                          size="small"
                        />
                      </TableCell>

                      <TableCell sx={{ minWidth: 120 }}>
                        <TextField
                          type="time"
                          label="Koniec"
                          value={draft.endTime}
                          onChange={(e) =>
                            setEditRefereePlanDrafts((prev) =>
                              prev.map((d, i) => (i === idx ? { ...d, endTime: e.target.value } : d))
                            )
                          }
                          InputLabelProps={{ shrink: true }}
                          size="small"
                        />
                      </TableCell>

                      <TableCell sx={{ minWidth: 180 }}>
                        <TextField
                          select
                          label="Drużyna B"
                          value={draft.teamBId}
                          onChange={(e) =>
                            setEditRefereePlanDrafts((prev) =>
                              prev.map((d, i) => (i === idx ? { ...d, teamBId: String(e.target.value) } : d))
                            )
                          }
                          size="small"
                          fullWidth
                        >
                          {tournament.teams.map((t) => (
                            <MenuItem key={t.id} value={t.id} disabled={t.id === draft.teamAId}>
                              {t.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </TableCell>

                      <TableCell sx={{ minWidth: 95 }}>
                        <TextField
                          select
                          label="Boisko"
                          value={draft.court}
                          onChange={(e) =>
                            setEditRefereePlanDrafts((prev) =>
                              prev.map((d, i) => (i === idx ? { ...d, court: String(e.target.value) } : d))
                            )
                          }
                          size="small"
                        >
                          <MenuItem value="1">1</MenuItem>
                          <MenuItem value="2">2</MenuItem>
                        </TextField>
                      </TableCell>

                      <TableCell sx={{ minWidth: 160 }}>
                        <TextField
                          select
                          label="Sędzia 1"
                          value={draft.referee1Id}
                          onChange={(e) =>
                            setEditRefereePlanDrafts((prev) =>
                              prev.map((d, i) => (i === idx ? { ...d, referee1Id: String(e.target.value) } : d))
                            )
                          }
                          size="small"
                          fullWidth
                        >
                          <MenuItem value="">—</MenuItem>
                          {tournament.referees.map((r) => (
                            <MenuItem
                              key={r.id}
                              value={r.id}
                              disabled={
                                r.id !== draft.referee1Id &&
                                [draft.referee2Id, draft.tablePenaltyId, draft.tableClockId].includes(r.id)
                              }
                            >
                              {personDisplayName(r)}
                            </MenuItem>
                          ))}
                        </TextField>
                      </TableCell>

                      <TableCell sx={{ minWidth: 160 }}>
                        <TextField
                          select
                          label="Sędzia 2"
                          value={draft.referee2Id}
                          onChange={(e) =>
                            setEditRefereePlanDrafts((prev) =>
                              prev.map((d, i) => (i === idx ? { ...d, referee2Id: String(e.target.value) } : d))
                            )
                          }
                          size="small"
                          fullWidth
                        >
                          <MenuItem value="">—</MenuItem>
                          {tournament.referees.map((r) => (
                            <MenuItem
                              key={r.id}
                              value={r.id}
                              disabled={
                                r.id !== draft.referee2Id &&
                                [draft.referee1Id, draft.tablePenaltyId, draft.tableClockId].includes(r.id)
                              }
                            >
                              {personDisplayName(r)}
                            </MenuItem>
                          ))}
                        </TextField>
                      </TableCell>

                      <TableCell sx={{ minWidth: 160 }}>
                        <TextField
                          select
                          label="Stolik kar"
                          value={draft.tablePenaltyId}
                          onChange={(e) =>
                            setEditRefereePlanDrafts((prev) =>
                              prev.map((d, i) => (i === idx ? { ...d, tablePenaltyId: String(e.target.value) } : d))
                            )
                          }
                          size="small"
                          fullWidth
                        >
                          <MenuItem value="">—</MenuItem>
                          {tournament.referees.map((r) => (
                            <MenuItem
                              key={r.id}
                              value={r.id}
                              disabled={
                                r.id !== draft.tablePenaltyId &&
                                [draft.referee1Id, draft.referee2Id, draft.tableClockId].includes(r.id)
                              }
                            >
                              {personDisplayName(r)}
                            </MenuItem>
                          ))}
                        </TextField>
                      </TableCell>

                      <TableCell sx={{ minWidth: 160 }}>
                        <TextField
                          select
                          label="Zagary"
                          value={draft.tableClockId}
                          onChange={(e) =>
                            setEditRefereePlanDrafts((prev) =>
                              prev.map((d, i) => (i === idx ? { ...d, tableClockId: String(e.target.value) } : d))
                            )
                          }
                          size="small"
                          fullWidth
                        >
                          <MenuItem value="">—</MenuItem>
                          {tournament.referees.map((r) => (
                            <MenuItem
                              key={r.id}
                              value={r.id}
                              disabled={
                                r.id !== draft.tableClockId &&
                                [draft.referee1Id, draft.referee2Id, draft.tablePenaltyId].includes(r.id)
                              }
                            >
                              {personDisplayName(r)}
                            </MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-start" }}>
            <Button variant="outlined" onClick={addAnotherEditRefereePlanRow} disabled={editRefereePlanLoading}>
              Dodaj kolejny wpis sędziów
            </Button>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeEditRefereePlanDialog} disabled={editRefereePlanLoading}>
            Anuluj
          </Button>
          <Button variant="contained" onClick={submitEditedRefereePlan} disabled={editRefereePlanLoading}>
            Zapisz
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={addTeamsOpen} onClose={closeAddTeamsDialog} fullWidth maxWidth="sm">
        <DialogTitle>Dodaj drużyny</DialogTitle>
        <DialogContent dividers>
          {availableTeamsError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {availableTeamsError}
            </Alert>
          ) : null}
          {saveTeamsError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {saveTeamsError}
            </Alert>
          ) : null}

          {availableTeamsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <List dense>
              {availableTeams.map((team) => {
                const checked = selectedTeamIds.includes(team.id);
                return (
                  <ListItemButton key={team.id} onClick={() => toggleSelected(team.id)}>
                    <ListItemIcon>
                      <Checkbox edge="start" checked={checked} tabIndex={-1} disableRipple />
                    </ListItemIcon>
                    <ListItemText primary={team.name} />
                  </ListItemButton>
                );
              })}
              {availableTeams.length === 0 && !availableTeamsError ? (
                <Typography color="textSecondary" sx={{ py: 1 }}>
                  Brak dostępnych drużyn w tym sezonie.
                </Typography>
              ) : null}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAddTeamsDialog} disabled={saveTeamsLoading}>
            Anuluj
          </Button>
          <Button variant="contained" onClick={saveSelectedTeams} disabled={saveTeamsLoading || availableTeamsLoading}>
            Dodaj
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmationDialog
        open={Boolean(matchToDelete)}
        title="Usunąć mecz?"
        description={
          matchToDelete ? (
            <Typography color="textSecondary">
              {tournament.teams.find((t) => t.id === matchToDelete.teamAId)?.name ?? matchToDelete.teamAId} vs{" "}
              {tournament.teams.find((t) => t.id === matchToDelete.teamBId)?.name ?? matchToDelete.teamBId}
            </Typography>
          ) : null
        }
        onClose={closeDeleteMatchDialog}
        onConfirm={confirmDeleteMatch}
        loading={deleteMatchLoading}
        errorMessage={deleteMatchError}
        confirmLabel="Usuń"
        cancelLabel="Anuluj"
      />

      <ConfirmationDialog
        open={Boolean(matchDayToDelete)}
        title="Usunąć dzień?"
        description={
          matchDayToDelete != null ? (
            <Typography color="textSecondary">{getScheduleDayLabel(matchDayToDelete)}</Typography>
          ) : null
        }
        onClose={closeDeleteMatchDayDialog}
        onConfirm={confirmDeleteMatchDay}
        loading={deleteMatchDayLoading}
        errorMessage={deleteMatchDayError}
        confirmLabel="Usuń"
        cancelLabel="Anuluj"
      />

      <ConfirmationDialog
        open={Boolean(teamToRemove)}
        title="Usunąć drużynę z turnieju?"
        description={
          teamToRemove ? (
            <Typography color="textSecondary">
              Drużyna: <strong>{teamToRemove.name}</strong>
            </Typography>
          ) : null
        }
        onClose={closeRemoveTeamDialog}
        onConfirm={confirmRemoveTeam}
        loading={removeTeamLoading}
        errorMessage={removeTeamError}
        confirmLabel="Usuń"
        cancelLabel="Anuluj"
      />

      <Dialog open={addRefereesOpen} onClose={closeAddRefereesDialog} fullWidth maxWidth="sm">
        <DialogTitle>Dodaj sędziów</DialogTitle>
        <DialogContent dividers>
          {availableRefereesError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {availableRefereesError}
            </Alert>
          ) : null}
          {saveRefereesError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {saveRefereesError}
            </Alert>
          ) : null}
          {availableRefereesLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <List dense>
              {availableReferees.map((referee) => {
                const checked = selectedRefereeIds.includes(referee.id);
                return (
                  <ListItemButton key={referee.id} onClick={() => toggleSelectedReferee(referee.id)}>
                    <ListItemIcon>
                      <Checkbox edge="start" checked={checked} tabIndex={-1} disableRipple />
                    </ListItemIcon>
                    <ListItemText primary={personDisplayName(referee)} />
                  </ListItemButton>
                );
              })}
              {availableReferees.length === 0 && !availableRefereesError ? (
                <Typography color="textSecondary" sx={{ py: 1 }}>
                  Brak dostępnych sędziów w tym sezonie.
                </Typography>
              ) : null}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAddRefereesDialog} disabled={saveRefereesLoading}>
            Anuluj
          </Button>
          <Button
            variant="contained"
            onClick={saveSelectedReferees}
            disabled={saveRefereesLoading || availableRefereesLoading}
          >
            Dodaj
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmationDialog
        open={Boolean(refereeToRemove)}
        title="Usunąć sędziego z turnieju?"
        description={
          refereeToRemove ? (
            <Typography color="textSecondary">
              Sędzia: <strong>{personDisplayName(refereeToRemove)}</strong>
            </Typography>
          ) : null
        }
        onClose={closeRemoveRefereeDialog}
        onConfirm={confirmRemoveReferee}
        loading={removeRefereeLoading}
        errorMessage={removeRefereeError}
        confirmLabel="Usuń"
        cancelLabel="Anuluj"
      />

      <Dialog open={addClassifiersOpen} onClose={closeAddClassifiersDialog} fullWidth maxWidth="sm">
        <DialogTitle>Dodaj klasyfikatorów</DialogTitle>
        <DialogContent dividers>
          {availableClassifiersError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {availableClassifiersError}
            </Alert>
          ) : null}
          {saveClassifiersError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {saveClassifiersError}
            </Alert>
          ) : null}
          {availableClassifiersLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <List dense>
              {availableClassifiers.map((classifier) => {
                const checked = selectedClassifierIds.includes(classifier.id);
                return (
                  <ListItemButton key={classifier.id} onClick={() => toggleSelectedClassifier(classifier.id)}>
                    <ListItemIcon>
                      <Checkbox edge="start" checked={checked} tabIndex={-1} disableRipple />
                    </ListItemIcon>
                    <ListItemText primary={personDisplayName(classifier)} />
                  </ListItemButton>
                );
              })}
              {availableClassifiers.length === 0 && !availableClassifiersError ? (
                <Typography color="textSecondary" sx={{ py: 1 }}>
                  Brak dostępnych klasyfikatorów w tym sezonie.
                </Typography>
              ) : null}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAddClassifiersDialog} disabled={saveClassifiersLoading}>
            Anuluj
          </Button>
          <Button
            variant="contained"
            onClick={saveSelectedClassifiers}
            disabled={saveClassifiersLoading || availableClassifiersLoading}
          >
            Dodaj
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmationDialog
        open={Boolean(classifierToRemove)}
        title="Usunąć klasyfikatora z turnieju?"
        description={
          classifierToRemove ? (
            <Typography color="textSecondary">
              Klasyfikator: <strong>{personDisplayName(classifierToRemove)}</strong>
            </Typography>
          ) : null
        }
        onClose={closeRemoveClassifierDialog}
        onConfirm={confirmRemoveClassifier}
        loading={removeClassifierLoading}
        errorMessage={removeClassifierError}
        confirmLabel="Usuń"
        cancelLabel="Anuluj"
      />
    </Box>
  );
}
