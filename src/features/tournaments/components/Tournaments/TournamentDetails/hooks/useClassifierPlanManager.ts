import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Tournament } from "@/types";
import {
  formatDayOptionLabel,
  type MatchDayOption,
  timeToMinutes,
} from "@/features/tournaments/components/Tournaments/TournamentDetails/hooks/matchPlanHelpers";
import {
  createTournamentClassifierPlanEntry,
  deleteTournamentClassifierPlanEntry,
  fetchTournamentClassifierPlan,
  updateTournamentClassifierPlanEntry,
} from "@/lib/api/tournaments";
import { queryKeys } from "@/lib/queryKeys";

interface ClassifierPlanDraft {
  id?: string;
  playerId: string;
  startTime: string;
  endTime: string;
  classification: string;
  observation: boolean;
}

interface DialogControls {
  open: boolean;
  loading: boolean;
  error: string | null;
}

interface AddClassifierPlanControls extends DialogControls {
  dayTimestamp: number | null;
  setDayTimestamp: (value: number | null) => void;
  playerId: string;
  setPlayerId: (value: string) => void;
  startTime: string;
  setStartTime: (value: string) => void;
  endTime: string;
  setEndTime: (value: string) => void;
  classification: string;
  setClassification: (value: string) => void;
  observation: boolean;
  setObservation: (value: boolean) => void;
  search: string;
  setSearch: (value: string) => void;
  dayOptions: MatchDayOption[];
  openDialog: (presetDayTimestamp?: number | null, allowedDays?: number[] | null) => void;
  closeDialog: () => void;
  submit: () => Promise<void>;
}

interface EditClassifierPlanControls extends DialogControls {
  dayTimestamp: number | null;
  setDayTimestamp: (value: number | null) => void;
  drafts: ClassifierPlanDraft[];
  setDrafts: Dispatch<SetStateAction<ClassifierPlanDraft[]>>;
  dayOptions: MatchDayOption[];
  addRow: () => void;
  openDialog: (dayTimestamp: number) => void;
  closeDialog: () => void;
  submit: () => Promise<void>;
  deleteEntry: (examId: string) => Promise<void>;
}

interface UseClassifierPlanManagerArgs {
  tournament: Tournament | null;
  matchDayOptions: MatchDayOption[];
}

interface ClassifierPlanManager {
  classifierPlanRows: {
    examId: string;
    playerId: string;
    scheduledAt: string;
    endsAt: string;
    classification?: number;
    observation: boolean;
  }[];
  classifierPlanLoading: boolean;
  classifierPlanError: string | null;
  refreshClassifierPlan: (tournamentId: string) => Promise<void>;
  classifierDayTimestamps: number[];
  canCreateNewDay: boolean;
  addEmptyDay: (timestamp: number) => void;
  removeDay: (timestamp: number) => void;
  add: AddClassifierPlanControls;
  edit: EditClassifierPlanControls;
}

const DEFAULT_START = "10:00";
const EXAM_DURATION_MINUTES = 30;

function isValidClassification(value: number) {
  return value >= 0 && value <= 4 && Number.isInteger(value * 2);
}

function getEnd(startTime: string) {
  const startMinutes = timeToMinutes(startTime);
  if (startMinutes == null) return "10:30";
  const h = Math.floor((startMinutes + EXAM_DURATION_MINUTES) / 60) % 24;
  const m = (startMinutes + EXAM_DURATION_MINUTES) % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function toDayTimestamp(iso: string) {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export default function useClassifierPlanManager({
  tournament,
  matchDayOptions,
}: UseClassifierPlanManagerArgs): ClassifierPlanManager {
  const queryClient = useQueryClient();
  const tid = tournament?.id;
  const storageKey = tid ? `wr-classifier-plan-days:${tid}` : null;

  const {
    data: classifierPlanRows = [],
    isPending: classifierPlanLoading,
    isError: classifierPlanQueryError,
    error: classifierPlanErr,
  } = useQuery({
    queryKey: queryKeys.tournaments.classifierPlan(tid ?? "__none__"),
    queryFn: ({ signal }) => {
      if (!tid) throw new Error("Brak turnieju");
      return fetchTournamentClassifierPlan(tid, signal);
    },
    enabled: Boolean(tid),
  });

  const classifierPlanError =
    classifierPlanQueryError && classifierPlanErr instanceof Error ? classifierPlanErr.message : null;

  const [savedEmptyDays, setSavedEmptyDays] = useState<number[]>([]);

  const [addOpen, setAddOpen] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addDayTimestamp, setAddDayTimestamp] = useState<number | null>(null);
  const [addPlayerId, setAddPlayerId] = useState("");
  const [addStartTime, setAddStartTime] = useState(DEFAULT_START);
  const [addEndTime, setAddEndTime] = useState(getEnd(DEFAULT_START));
  const [addClassification, setAddClassification] = useState("");
  const [addObservation, setAddObservation] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [allowedAddDays, setAllowedAddDays] = useState<number[] | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editDayTimestamp, setEditDayTimestamp] = useState<number | null>(null);
  const [editDrafts, setEditDrafts] = useState<ClassifierPlanDraft[]>([]);

  const createMutation = useMutation({
    mutationFn: (payload: {
      playerId: string;
      scheduledAt: string;
      endsAt: string;
      classification?: number;
      observation?: boolean;
    }) => {
      if (!tid) throw new Error("Brak turnieju");
      return createTournamentClassifierPlanEntry(tid, payload);
    },
  });
  const saveMutation = useMutation({
    mutationFn: (payload: {
      examId?: string;
      playerId: string;
      scheduledAt: string;
      endsAt: string;
      classification?: number;
      observation?: boolean;
    }) => {
      if (!tid) throw new Error("Brak turnieju");
      if (payload.examId) {
        return updateTournamentClassifierPlanEntry(tid, payload.examId, payload);
      }
      return createTournamentClassifierPlanEntry(tid, payload);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (examId: string) => {
      if (!tid) throw new Error("Brak turnieju");
      return deleteTournamentClassifierPlanEntry(tid, examId);
    },
  });

  const addDayOptions = useMemo(() => {
    if (allowedAddDays) return matchDayOptions.filter((o) => allowedAddDays.includes(o.timestamp));
    return matchDayOptions;
  }, [allowedAddDays, matchDayOptions]);

  const editDayOptions = useMemo(() => {
    if (editDayTimestamp == null || matchDayOptions.some((o) => o.timestamp === editDayTimestamp))
      return matchDayOptions;
    return [...matchDayOptions, { timestamp: editDayTimestamp, label: formatDayOptionLabel(editDayTimestamp) }];
  }, [editDayTimestamp, matchDayOptions]);

  const refreshClassifierPlan = useCallback(
    async (tournamentId: string) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.classifierPlan(tournamentId) });
    },
    [queryClient]
  );

  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        setSavedEmptyDays([]);
        return;
      }
      const parsed = JSON.parse(raw) as unknown;
      const arr = Array.isArray(parsed) ? parsed.filter((v) => typeof v === "number") : [];
      setSavedEmptyDays(arr);
    } catch {
      setSavedEmptyDays([]);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(savedEmptyDays));
    } catch {
      /* ignore */
    }
  }, [savedEmptyDays, storageKey]);

  const classifierDayTimestamps = useMemo(() => {
    const fromRows = classifierPlanRows.map((r) => toDayTimestamp(r.scheduledAt));
    return Array.from(new Set([...fromRows, ...savedEmptyDays])).sort((a, b) => a - b);
  }, [classifierPlanRows, savedEmptyDays]);

  const canCreateNewDay = useMemo(() => {
    const used = new Set(classifierDayTimestamps);
    return matchDayOptions.some((o) => !used.has(o.timestamp));
  }, [classifierDayTimestamps, matchDayOptions]);

  const addEmptyDay = useCallback(
    (timestamp: number) => {
      setSavedEmptyDays((prev) => Array.from(new Set([...prev, timestamp])).sort((a, b) => a - b));
    },
    [setSavedEmptyDays]
  );

  const removeDay = useCallback(
    (timestamp: number) => {
      setSavedEmptyDays((prev) => prev.filter((t) => t !== timestamp));
    },
    [setSavedEmptyDays]
  );

  function openAddDialog(presetDayTimestamp?: number | null, allowedDays?: number[] | null) {
    if (!tournament) return;
    setAddOpen(true);
    setAddError(null);
    createMutation.reset();
    setAllowedAddDays(allowedDays ?? null);
    setAddDayTimestamp(presetDayTimestamp ?? matchDayOptions[0]?.timestamp ?? null);
    const firstPlayer = tournament.teams.flatMap((t) => t.players ?? [])[0];
    setAddPlayerId(firstPlayer?.id ?? "");
    setAddStartTime(DEFAULT_START);
    setAddEndTime(getEnd(DEFAULT_START));
    setAddClassification("");
    setAddObservation(false);
    setAddSearch("");
  }

  function closeAddDialog() {
    if (createMutation.isPending) return;
    setAddOpen(false);
    setAddError(null);
    setAllowedAddDays(null);
  }

  async function submitAdd() {
    if (!tournament || !addDayTimestamp) return;
    if (!addPlayerId) return setAddError("Wybierz zawodnika");
    const startMinutes = timeToMinutes(addStartTime);
    if (startMinutes == null) return setAddError("Podaj poprawną godzinę startu");
    const endMinutes = timeToMinutes(addEndTime);
    if (endMinutes == null) return setAddError("Podaj poprawną godzinę zakończenia");
    const day = new Date(addDayTimestamp);
    const scheduledAtDate = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      Math.floor(startMinutes / 60),
      startMinutes % 60,
      0,
      0
    );
    const endsAtDate = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      Math.floor(endMinutes / 60),
      endMinutes % 60,
      0,
      0
    );
    if (endsAtDate.getTime() <= scheduledAtDate.getTime()) return setAddError("Koniec musi być po starcie");
    const scheduledAt = scheduledAtDate.toISOString();
    const endsAt = endsAtDate.toISOString();
    const classification = addClassification.trim() === "" ? undefined : Number(addClassification);
    if (classification != null && !Number.isFinite(classification)) return setAddError("Podaj poprawną klasyfikację");
    if (classification != null && !isValidClassification(classification))
      return setAddError("Klasyfikacja musi być od 0 do 4 z krokiem 0.5");

    setAddError(null);
    try {
      await createMutation.mutateAsync({
        playerId: addPlayerId,
        scheduledAt,
        endsAt,
        classification,
        observation: addObservation,
      });
      await refreshClassifierPlan(tournament.id);
      addEmptyDay(addDayTimestamp);
      setAddOpen(false);
    } catch (e) {
      setAddError(e instanceof Error ? e.message : "Nie udało się utworzyć wpisu planu klasyfikatorów");
    }
  }

  function openEditDialog(dayTimestamp: number) {
    if (!tournament) return;
    const rows = classifierPlanRows.filter((r) => toDayTimestamp(r.scheduledAt) === dayTimestamp);
    setEditDrafts(
      rows.map((row) => {
        const d = new Date(row.scheduledAt);
        const startTime = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
        const e = new Date(row.endsAt);
        const endTime = `${String(e.getHours()).padStart(2, "0")}:${String(e.getMinutes()).padStart(2, "0")}`;
        return {
          id: row.examId,
          playerId: row.playerId,
          startTime,
          endTime,
          classification: row.classification != null ? String(row.classification) : "",
          observation: row.observation,
        };
      })
    );
    setEditDayTimestamp(dayTimestamp);
    setEditError(null);
    setEditOpen(true);
  }

  function closeEditDialog() {
    if (saveMutation.isPending || deleteMutation.isPending) return;
    setEditOpen(false);
    setEditError(null);
    setEditDayTimestamp(null);
    setEditDrafts([]);
  }

  function addRow() {
    const firstPlayer = tournament?.teams.flatMap((t) => t.players ?? [])[0];
    setEditDrafts((prev) => [
      ...prev,
      {
        playerId: firstPlayer?.id ?? "",
        startTime: DEFAULT_START,
        endTime: getEnd(DEFAULT_START),
        classification: "",
        observation: false,
      },
    ]);
  }

  async function submitEdit() {
    if (!tournament || !editDayTimestamp) return;
    setEditError(null);

    // Validate all drafts before saving
    const day = new Date(editDayTimestamp);
    const payloads: {
      examId?: string;
      playerId: string;
      scheduledAt: string;
      endsAt: string;
      classification?: number;
      observation?: boolean;
    }[] = [];
    for (const draft of editDrafts) {
      const startMinutes = timeToMinutes(draft.startTime);
      if (startMinutes == null) return setEditError("Podaj poprawną godzinę startu");
      const endMinutes = timeToMinutes(draft.endTime);
      if (endMinutes == null) return setEditError("Podaj poprawną godzinę zakończenia");
      if (!draft.playerId) return setEditError("Wybierz zawodnika");
      const scheduledAtDate = new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate(),
        Math.floor(startMinutes / 60),
        startMinutes % 60,
        0,
        0
      );
      const endsAtDate = new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate(),
        Math.floor(endMinutes / 60),
        endMinutes % 60,
        0,
        0
      );
      if (endsAtDate.getTime() <= scheduledAtDate.getTime()) return setEditError("Koniec musi być po starcie");
      const scheduledAt = scheduledAtDate.toISOString();
      const endsAt = endsAtDate.toISOString();
      const classification = draft.classification.trim() === "" ? undefined : Number(draft.classification);
      if (classification != null && !Number.isFinite(classification))
        return setEditError("Podaj poprawną klasyfikację");
      if (classification != null && !isValidClassification(classification))
        return setEditError("Klasyfikacja musi być od 0 do 4 z krokiem 0.5");
      payloads.push({
        examId: draft.id,
        playerId: draft.playerId,
        scheduledAt,
        endsAt,
        classification,
        observation: draft.observation,
      });
    }

    try {
      for (const payload of payloads) {
        await saveMutation.mutateAsync(payload);
      }
      await refreshClassifierPlan(tournament.id);
      addEmptyDay(editDayTimestamp);
      closeEditDialog();
    } catch (e) {
      setEditError(e instanceof Error ? e.message : "Nie udało się zapisać planu klasyfikatorów");
    }
  }

  async function deleteEntry(examId: string) {
    if (!tournament) return;
    try {
      await deleteMutation.mutateAsync(examId);
      await refreshClassifierPlan(tournament.id);
      setEditDrafts((prev) => prev.filter((d) => d.id !== examId));
    } catch (e) {
      setEditError(e instanceof Error ? e.message : "Nie udało się usunąć wpisu");
    }
  }

  return {
    classifierPlanRows,
    classifierPlanLoading,
    classifierPlanError,
    refreshClassifierPlan,
    classifierDayTimestamps,
    canCreateNewDay,
    addEmptyDay,
    removeDay,
    add: {
      open: addOpen,
      loading: createMutation.isPending,
      error: addError,
      dayTimestamp: addDayTimestamp,
      setDayTimestamp: setAddDayTimestamp,
      playerId: addPlayerId,
      setPlayerId: setAddPlayerId,
      startTime: addStartTime,
      setStartTime: setAddStartTime,
      endTime: addEndTime,
      setEndTime: setAddEndTime,
      classification: addClassification,
      setClassification: setAddClassification,
      observation: addObservation,
      setObservation: setAddObservation,
      search: addSearch,
      setSearch: setAddSearch,
      dayOptions: addDayOptions,
      openDialog: openAddDialog,
      closeDialog: closeAddDialog,
      submit: submitAdd,
    },
    edit: {
      open: editOpen,
      loading: saveMutation.isPending || deleteMutation.isPending,
      error: editError,
      dayTimestamp: editDayTimestamp,
      setDayTimestamp: setEditDayTimestamp,
      drafts: editDrafts,
      setDrafts: setEditDrafts,
      dayOptions: editDayOptions,
      addRow,
      openDialog: openEditDialog,
      closeDialog: closeEditDialog,
      submit: submitEdit,
      deleteEntry,
    },
  };
}

export type ClassifierPlanManagerReturn = ReturnType<typeof useClassifierPlanManager>;
export type ClassifierPlanAddState = ClassifierPlanManagerReturn["add"];
export type ClassifierPlanEditState = ClassifierPlanManagerReturn["edit"];
