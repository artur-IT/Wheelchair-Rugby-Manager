import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Match, RefereePlanMatch, RefereeRole, Tournament } from "@/types";
import {
  MATCH_DURATION_MINUTES,
  MatchDayOption,
  formatDayOptionLabel,
  minutesToTime,
  pad2,
  timeToMinutes,
} from "@/components/TournamentDetails/hooks/matchPlanHelpers";

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

const DEFAULT_REFEREE_PLAN_START_TIME = "10:00";
const DEFAULT_REFEREE_PLAN_END_TIME = minutesToTime(10 * 60 + MATCH_DURATION_MINUTES);

const getRefereePlanEndFromStart = (startTime: string) => {
  const startMinutes = timeToMinutes(startTime);
  if (startMinutes == null) return DEFAULT_REFEREE_PLAN_END_TIME;
  return minutesToTime(startMinutes + MATCH_DURATION_MINUTES);
};

interface DialogControls {
  open: boolean;
  loading: boolean;
  error: string | null;
}

interface AddRefereePlanControls extends DialogControls {
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
  referee1Id: string;
  setReferee1Id: (value: string) => void;
  referee2Id: string;
  setReferee2Id: (value: string) => void;
  tablePenaltyId: string;
  setTablePenaltyId: (value: string) => void;
  tableClockId: string;
  setTableClockId: (value: string) => void;
  dayOptions: MatchDayOption[];
  openDialog: (presetDayTimestamp?: number | null, allowedDays?: number[] | null) => void;
  closeDialog: () => void;
  submit: () => Promise<void>;
}

interface EditRefereePlanControls extends DialogControls {
  dayTimestamp: number | null;
  setDayTimestamp: (value: number | null) => void;
  drafts: RefereePlanDraft[];
  setDrafts: Dispatch<SetStateAction<RefereePlanDraft[]>>;
  dayOptions: MatchDayOption[];
  addRow: () => void;
  openDialog: (matchesToEdit: Match[]) => void;
  closeDialog: () => void;
  submit: () => Promise<void>;
}

interface UseRefereePlanManagerArgs {
  tournament: Tournament | null;
  matches: Match[];
  matchDayOptions: MatchDayOption[];
  refreshMatches: (id: string) => Promise<void>;
}

interface RefereePlanManager {
  refereePlanByMatchId: Record<string, Partial<Record<RefereeRole, string>>>;
  refereePlanLoading: boolean;
  refereePlanError: string | null;
  refreshRefereePlan: (tournamentId: string) => Promise<void>;
  add: AddRefereePlanControls;
  edit: EditRefereePlanControls;
}

export default function useRefereePlanManager({
  tournament,
  matchDayOptions,
  refreshMatches,
}: UseRefereePlanManagerArgs): RefereePlanManager {
  const [refereePlanByMatchId, setRefereePlanByMatchId] = useState<
    Record<string, Partial<Record<RefereeRole, string>>>
  >({});
  const [refereePlanLoading, setRefereePlanLoading] = useState(false);
  const [refereePlanError, setRefereePlanError] = useState<string | null>(null);

  const [addRefereePlanOpen, setAddRefereePlanOpen] = useState(false);
  const [createRefereePlanLoading, setCreateRefereePlanLoading] = useState(false);
  const [createRefereePlanError, setCreateRefereePlanError] = useState<string | null>(null);
  const [newRefereePlanDayTimestamp, setNewRefereePlanDayTimestamp] = useState<number | null>(null);
  const [newRefereePlanTeamAId, setNewRefereePlanTeamAId] = useState("");
  const [newRefereePlanTeamBId, setNewRefereePlanTeamBId] = useState("");
  const [newRefereePlanStartTime, setNewRefereePlanStartTime] = useState(DEFAULT_REFEREE_PLAN_START_TIME);
  const [newRefereePlanEndTime, setNewRefereePlanEndTime] = useState(DEFAULT_REFEREE_PLAN_END_TIME);
  const [newRefereePlanCourt, setNewRefereePlanCourt] = useState("1");
  const [newRefereePlanReferee1Id, setNewRefereePlanReferee1Id] = useState("");
  const [newRefereePlanReferee2Id, setNewRefereePlanReferee2Id] = useState("");
  const [newRefereePlanTablePenaltyId, setNewRefereePlanTablePenaltyId] = useState("");
  const [newRefereePlanTableClockId, setNewRefereePlanTableClockId] = useState("");
  const [allowedNewRefereePlanDayTimestamps, setAllowedNewRefereePlanDayTimestamps] = useState<number[] | null>(null);

  const [editRefereePlanOpen, setEditRefereePlanOpen] = useState(false);
  const [editRefereePlanDayTimestamp, setEditRefereePlanDayTimestamp] = useState<number | null>(null);
  const [editRefereePlanLoading, setEditRefereePlanLoading] = useState(false);
  const [editRefereePlanError, setEditRefereePlanError] = useState<string | null>(null);
  const [editRefereePlanDrafts, setEditRefereePlanDrafts] = useState<RefereePlanDraft[]>([]);

  useEffect(() => {
    setNewRefereePlanEndTime(getRefereePlanEndFromStart(newRefereePlanStartTime));
  }, [newRefereePlanStartTime]);

  const refreshRefereePlan = useCallback(async (tournamentId: string) => {
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
  }, []);

  useEffect(() => {
    if (!tournament?.id) return;
    void refreshRefereePlan(tournament.id);
  }, [tournament?.id, refreshRefereePlan]);

  const newRefereePlanDayOptionsForSelect = useMemo(() => {
    if (allowedNewRefereePlanDayTimestamps) {
      return matchDayOptions.filter((o) => allowedNewRefereePlanDayTimestamps.includes(o.timestamp));
    }
    return matchDayOptions;
  }, [allowedNewRefereePlanDayTimestamps, matchDayOptions]);

  const editRefereePlanDayOptions = useMemo(() => {
    if (
      editRefereePlanDayTimestamp != null &&
      !matchDayOptions.some((option) => option.timestamp === editRefereePlanDayTimestamp)
    ) {
      return [
        ...matchDayOptions,
        { timestamp: editRefereePlanDayTimestamp, label: formatDayOptionLabel(editRefereePlanDayTimestamp) },
      ];
    }
    return matchDayOptions;
  }, [editRefereePlanDayTimestamp, matchDayOptions]);

  function openAddRefereePlanDialog(presetDayTimestamp?: number | null, allowedDays?: number[] | null) {
    if (!tournament) return;

    setAddRefereePlanOpen(true);
    setCreateRefereePlanError(null);
    setCreateRefereePlanLoading(false);
    setAllowedNewRefereePlanDayTimestamps(allowedDays ?? null);

    setNewRefereePlanDayTimestamp(presetDayTimestamp ?? matchDayOptions[0]?.timestamp ?? null);

    const [teamA, teamB] = tournament.teams;
    setNewRefereePlanTeamAId(teamA?.id ?? "");
    setNewRefereePlanTeamBId(teamB?.id ?? "");
    setNewRefereePlanStartTime(DEFAULT_REFEREE_PLAN_START_TIME);
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
    const minMinutes = 7 * 60;
    const maxMinutes = 22 * 60;
    const latestStartMinutes = maxMinutes - MATCH_DURATION_MINUTES;
    const endMinutes = startMinutes + MATCH_DURATION_MINUTES;

    if (startMinutes < minMinutes || startMinutes > latestStartMinutes) {
      setCreateRefereePlanError("Start musi być w przedziale 07:00-20:30");
      return;
    }
    if (endMinutes > maxMinutes) {
      setCreateRefereePlanError("Mecz musi zakończyć się najpóźniej o 22:00");
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
        const hasValidMatchDate = !Number.isNaN(matchDate.getTime());
        const startTime = hasValidMatchDate
          ? `${pad2(matchDate.getHours())}:${pad2(matchDate.getMinutes())}`
          : DEFAULT_REFEREE_PLAN_START_TIME;
        const startMinutes = hasValidMatchDate ? matchDate.getHours() * 60 + matchDate.getMinutes() : 10 * 60;
        const endTime = minutesToTime(startMinutes + MATCH_DURATION_MINUTES);

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
        startTime: DEFAULT_REFEREE_PLAN_START_TIME,
        endTime: DEFAULT_REFEREE_PLAN_END_TIME,
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
        const latestStartMinutes = maxMinutes - MATCH_DURATION_MINUTES;
        const endMinutes = startMinutes + MATCH_DURATION_MINUTES;

        if (startMinutes < minMinutes || startMinutes > latestStartMinutes) {
          setEditRefereePlanError("Start musi być w przedziale 07:00-20:30");
          return;
        }
        if (endMinutes > maxMinutes) {
          setEditRefereePlanError("Mecz musi zakończyć się najpóźniej o 22:00");
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

  return {
    refereePlanByMatchId,
    refereePlanLoading,
    refereePlanError,
    refreshRefereePlan,
    add: {
      open: addRefereePlanOpen,
      loading: createRefereePlanLoading,
      error: createRefereePlanError,
      dayTimestamp: newRefereePlanDayTimestamp,
      setDayTimestamp: setNewRefereePlanDayTimestamp,
      teamAId: newRefereePlanTeamAId,
      setTeamAId: setNewRefereePlanTeamAId,
      teamBId: newRefereePlanTeamBId,
      setTeamBId: setNewRefereePlanTeamBId,
      startTime: newRefereePlanStartTime,
      setStartTime: setNewRefereePlanStartTime,
      endTime: newRefereePlanEndTime,
      setEndTime: setNewRefereePlanEndTime,
      court: newRefereePlanCourt,
      setCourt: setNewRefereePlanCourt,
      referee1Id: newRefereePlanReferee1Id,
      setReferee1Id: setNewRefereePlanReferee1Id,
      referee2Id: newRefereePlanReferee2Id,
      setReferee2Id: setNewRefereePlanReferee2Id,
      tablePenaltyId: newRefereePlanTablePenaltyId,
      setTablePenaltyId: setNewRefereePlanTablePenaltyId,
      tableClockId: newRefereePlanTableClockId,
      setTableClockId: setNewRefereePlanTableClockId,
      dayOptions: newRefereePlanDayOptionsForSelect,
      openDialog: openAddRefereePlanDialog,
      closeDialog: closeAddRefereePlanDialog,
      submit: submitNewRefereePlan,
    },
    edit: {
      open: editRefereePlanOpen,
      loading: editRefereePlanLoading,
      error: editRefereePlanError,
      dayTimestamp: editRefereePlanDayTimestamp,
      setDayTimestamp: setEditRefereePlanDayTimestamp,
      drafts: editRefereePlanDrafts,
      setDrafts: setEditRefereePlanDrafts,
      dayOptions: editRefereePlanDayOptions,
      addRow: addAnotherEditRefereePlanRow,
      openDialog: openEditRefereePlanDialog,
      closeDialog: closeEditRefereePlanDialog,
      submit: submitEditedRefereePlan,
    },
  };
}

export type RefereePlanManagerReturn = ReturnType<typeof useRefereePlanManager>;
export type RefereePlanAddState = RefereePlanManagerReturn["add"];
export type RefereePlanEditState = RefereePlanManagerReturn["edit"];
