import { useState, useEffect, Dispatch, SetStateAction } from "react";
import type { Match, Tournament } from "@/types";
import {
  MatchDayOption,
  formatDayOptionLabel,
  pad2,
  parseJerseyInfo,
  MATCH_DURATION_MINUTES,
  minutesToTime,
  timeToMinutes,
} from "@/components/TournamentDetails/hooks/matchPlanHelpers";

type JerseyColor = "jasne" | "ciemne";

interface MatchDraft {
  id?: string;
  teamAId: string;
  teamBId: string;
  startTime: string;
  endTime: string;
  court: string;
  scoreA: string;
  scoreB: string;
  jerseyA: JerseyColor;
  jerseyB: JerseyColor;
}

const DEFAULT_MATCH_START_TIME = "10:00";
const DEFAULT_MATCH_END_TIME = minutesToTime(10 * 60 + MATCH_DURATION_MINUTES);

const getMatchEndFromStart = (startTime: string) => {
  const startMinutes = timeToMinutes(startTime);
  if (startMinutes == null) return DEFAULT_MATCH_END_TIME;
  return minutesToTime(startMinutes + MATCH_DURATION_MINUTES);
};

interface UseMatchPlanManagerArgs {
  tournament: Tournament;
  refreshMatches: (id: string) => Promise<void>;
  refreshRefereePlan: (id: string) => Promise<void>;
  matchDayOptions: MatchDayOption[];
}

interface DialogControls {
  open: boolean;
  loading: boolean;
  error: string | null;
}

export default function useMatchPlanManager({
  tournament,
  refreshMatches,
  refreshRefereePlan,
  matchDayOptions,
}: UseMatchPlanManagerArgs) {
  const [addMatchOpen, setAddMatchOpen] = useState(false);
  const [createMatchLoading, setCreateMatchLoading] = useState(false);
  const [createMatchError, setCreateMatchError] = useState<string | null>(null);
  const [allowedNewDayTimestamps, setAllowedNewDayTimestamps] = useState<number[] | null>(null);

  const [newMatchDayTimestamp, setNewMatchDayTimestamp] = useState<number | null>(null);
  const [newMatchTeamAId, setNewMatchTeamAId] = useState<string>("");
  const [newMatchTeamBId, setNewMatchTeamBId] = useState<string>("");
  const [newMatchStartTime, setNewMatchStartTime] = useState<string>(DEFAULT_MATCH_START_TIME);
  const [newMatchEndTime, setNewMatchEndTime] = useState<string>(DEFAULT_MATCH_END_TIME);
  const [newMatchCourt, setNewMatchCourt] = useState<string>("1");
  const [newMatchScoreA, setNewMatchScoreA] = useState<string>("");
  const [newMatchScoreB, setNewMatchScoreB] = useState<string>("");
  const [newMatchJerseyA, setNewMatchJerseyA] = useState<JerseyColor>("jasne");
  const [newMatchJerseyB, setNewMatchJerseyB] = useState<JerseyColor>("ciemne");

  useEffect(() => {
    setNewMatchEndTime(getMatchEndFromStart(newMatchStartTime));
  }, [newMatchStartTime]);

  const [editMatchOpen, setEditMatchOpen] = useState(false);
  const [editMatch, setEditMatch] = useState<Match | null>(null);
  const [editMatchLoading, setEditMatchLoading] = useState(false);
  const [editMatchError, setEditMatchError] = useState<string | null>(null);
  const [editMatchDayTimestamp, setEditMatchDayTimestamp] = useState<number | null>(null);
  const [editMatchDrafts, setEditMatchDrafts] = useState<MatchDraft[]>([]);

  function openAddMatchDialog(presetDayTimestamp?: number | null, allowedDays?: number[] | null) {
    setAddMatchOpen(true);
    setCreateMatchError(null);
    setCreateMatchLoading(false);

    setNewMatchDayTimestamp(presetDayTimestamp ?? matchDayOptions[0]?.timestamp ?? null);
    setAllowedNewDayTimestamps(allowedDays ?? null);

    const [teamA, teamB] = tournament.teams;
    setNewMatchTeamAId(teamA?.id ?? "");
    setNewMatchTeamBId(teamB?.id ?? "");

    setNewMatchStartTime(DEFAULT_MATCH_START_TIME);
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
    const minMinutes = 7 * 60;
    const maxMinutes = 22 * 60;
    const latestStartMinutes = maxMinutes - MATCH_DURATION_MINUTES;
    const endMinutes = startMinutes + MATCH_DURATION_MINUTES;

    if (startMinutes < minMinutes || startMinutes > latestStartMinutes) {
      setCreateMatchError("Start musi być w przedziale 07:00-20:30");
      return;
    }

    if (endMinutes > maxMinutes) {
      setCreateMatchError("Mecz musi zakończyć się najpóźniej o 22:00");
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
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się utworzyć meczu";
      setCreateMatchError(message);
    } finally {
      setCreateMatchLoading(false);
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
        const hasValidMatchDate = !Number.isNaN(matchDate.getTime());
        const startTime = hasValidMatchDate
          ? `${pad2(matchDate.getHours())}:${pad2(matchDate.getMinutes())}`
          : DEFAULT_MATCH_START_TIME;
        const startMinutes = hasValidMatchDate ? matchDate.getHours() * 60 + matchDate.getMinutes() : 10 * 60;
        const endTime = minutesToTime(startMinutes + MATCH_DURATION_MINUTES);

        return {
          id: match.id,
          teamAId: match.teamAId,
          teamBId: match.teamBId,
          startTime,
          endTime,
          court: match.court ?? "1",
          scoreA: match.scoreA != null ? String(match.scoreA) : "",
          scoreB: match.scoreB != null ? String(match.scoreB) : "",
          jerseyA: parseJerseyInfo(match.jerseyInfo).teamA,
          jerseyB: parseJerseyInfo(match.jerseyInfo).teamB,
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
    const teamAId = tournament.teams[0]?.id ?? "";
    const teamBId = tournament.teams.find((t) => t.id !== teamAId)?.id ?? teamAId;
    setEditMatchDrafts((prev) => [
      ...prev,
      {
        teamAId,
        teamBId,
        startTime: DEFAULT_MATCH_START_TIME,
        endTime: DEFAULT_MATCH_END_TIME,
        court: "1",
        scoreA: "",
        scoreB: "",
        jerseyA: "jasne",
        jerseyB: "ciemne",
      },
    ]);
  }

  async function submitEditedMatch() {
    if (!editMatch) return;
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
        const minMinutes = 7 * 60;
        const maxMinutes = 22 * 60;
        const latestStartMinutes = maxMinutes - MATCH_DURATION_MINUTES;
        const endMinutes = startMinutes + MATCH_DURATION_MINUTES;

        if (startMinutes < minMinutes || startMinutes > latestStartMinutes) {
          setEditMatchError("Start musi być w przedziale 07:00-20:30");
          return;
        }
        if (endMinutes > maxMinutes) {
          setEditMatchError("Mecz musi zakończyć się najpóźniej o 22:00");
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
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się zaktualizować meczu";
      setEditMatchError(message);
    } finally {
      setEditMatchLoading(false);
    }
  }

  const newMatchDayOptionsForSelect = allowedNewDayTimestamps
    ? matchDayOptions.filter((o) => allowedNewDayTimestamps.includes(o.timestamp))
    : matchDayOptions;

  const editDayOptions =
    editMatchDayTimestamp != null && !matchDayOptions.some((o) => o.timestamp === editMatchDayTimestamp)
      ? [...matchDayOptions, { timestamp: editMatchDayTimestamp, label: formatDayOptionLabel(editMatchDayTimestamp) }]
      : matchDayOptions;

  const addMatch: DialogControls & {
    dayTimestamp: number | null;
    setDayTimestamp: (value: number | null) => void;
    teamAId: string;
    setTeamAId: (value: string) => void;
    teamBId: string;
    setTeamBId: (value: string) => void;
    startTime: string;
    setStartTime: (value: string) => void;
    endTime: string;
    setEndTime: (value: string) => void;
    court: string;
    setCourt: (value: string) => void;
    scoreA: string;
    setScoreA: (value: string) => void;
    scoreB: string;
    setScoreB: (value: string) => void;
    jerseyA: JerseyColor;
    setJerseyA: (value: JerseyColor) => void;
    jerseyB: JerseyColor;
    setJerseyB: (value: JerseyColor) => void;
    options: { timestamp: number; label: string }[];
    openDialog: (presetDayTimestamp?: number | null, allowedDays?: number[] | null) => void;
    closeDialog: () => void;
    submit: () => Promise<void>;
  } = {
    open: addMatchOpen,
    loading: createMatchLoading,
    error: createMatchError,
    dayTimestamp: newMatchDayTimestamp,
    setDayTimestamp: setNewMatchDayTimestamp,
    teamAId: newMatchTeamAId,
    setTeamAId: setNewMatchTeamAId,
    teamBId: newMatchTeamBId,
    setTeamBId: setNewMatchTeamBId,
    startTime: newMatchStartTime,
    setStartTime: setNewMatchStartTime,
    endTime: newMatchEndTime,
    setEndTime: setNewMatchEndTime,
    court: newMatchCourt,
    setCourt: setNewMatchCourt,
    scoreA: newMatchScoreA,
    setScoreA: setNewMatchScoreA,
    scoreB: newMatchScoreB,
    setScoreB: setNewMatchScoreB,
    jerseyA: newMatchJerseyA,
    setJerseyA: setNewMatchJerseyA,
    jerseyB: newMatchJerseyB,
    setJerseyB: setNewMatchJerseyB,
    options: newMatchDayOptionsForSelect,
    openDialog: openAddMatchDialog,
    closeDialog: closeAddMatchDialog,
    submit: submitNewMatch,
  };

  const editMatchControls: DialogControls & {
    dayTimestamp: number | null;
    setDayTimestamp: (value: number | null) => void;
    drafts: MatchDraft[];
    setDrafts: Dispatch<SetStateAction<MatchDraft[]>>;
    match: Match | null;
    setMatch: Dispatch<SetStateAction<Match | null>>;
    addRow: () => void;
    openDialog: (matchesToEdit: Match[]) => void;
    closeDialog: () => void;
    submit: () => Promise<void>;
    options: { timestamp: number; label: string }[];
  } = {
    open: editMatchOpen,
    loading: editMatchLoading,
    error: editMatchError,
    dayTimestamp: editMatchDayTimestamp,
    setDayTimestamp: setEditMatchDayTimestamp,
    drafts: editMatchDrafts,
    setDrafts: setEditMatchDrafts,
    match: editMatch,
    setMatch: setEditMatch,
    addRow: addAnotherEditMatchRow,
    openDialog: openEditMatchDialog,
    closeDialog: closeEditMatchDialog,
    submit: submitEditedMatch,
    options: editDayOptions,
  };

  return { addMatch, editMatch: editMatchControls };
}

export type MatchPlanManagerReturn = ReturnType<typeof useMatchPlanManager>;
export type MatchPlanAddState = MatchPlanManagerReturn["addMatch"];
export type MatchPlanEditState = MatchPlanManagerReturn["editMatch"];
