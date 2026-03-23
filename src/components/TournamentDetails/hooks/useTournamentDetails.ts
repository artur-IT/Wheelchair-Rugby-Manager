import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { SetStateAction } from "react";
import {
  buildMatchDayOptions,
  formatDayOptionLabel,
  getMatchDayTimestamp,
  isDayTimestampOutsideTournamentRange,
  isScheduledDayOutsideTournamentRange,
} from "./matchPlanHelpers";
import { fetchTournamentByIdOrNull, fetchTournamentMatches } from "@/lib/api/tournaments";
import { queryKeys } from "@/lib/queryKeys";
import type { Match, Tournament } from "@/types";

interface UseTournamentDetailsResult {
  tournament: Tournament | null;
  loading: boolean;
  error: string | null;
  refetchTournament: () => void;
  matches: Match[];
  matchesLoading: boolean;
  matchesError: string | null;
  scheduleDayTimestamps: number[];
  setScheduleDayTimestamps: (value: SetStateAction<number[]>) => void;
  matchDayOptions: ReturnType<typeof buildMatchDayOptions>;
  scheduleTableDayTimestamps: number[];
  getScheduleDayLabel: (timestamp: number) => string;
  refreshTournament: (nextId: string) => Promise<void>;
  refreshMatches: (tournamentId: string) => Promise<void>;
  /** True if any match falls outside current tournament start/end (calendar days). */
  hasMatchesOutsideTournamentRange: boolean;
  isScheduledDayOutsideTournamentRange: (scheduledAtIso: string) => boolean;
  isDayTimestampOutsideTournamentRange: (dayTimestamp: number) => boolean;
}

export default function useTournamentDetails(id: string): UseTournamentDetailsResult {
  const queryClient = useQueryClient();
  const [scheduleDayTimestamps, setScheduleDayTimestamps] = useState<number[]>([]);

  const {
    data: tournament = null,
    isPending: loading,
    isError: tournamentQueryError,
    error: tournamentErr,
  } = useQuery({
    queryKey: queryKeys.tournaments.detail(id),
    queryFn: ({ signal }) => fetchTournamentByIdOrNull(id, signal),
  });

  const error = tournamentQueryError && tournamentErr instanceof Error ? tournamentErr.message : null;

  const tournamentId = tournament?.id;

  const {
    data: matches = [],
    isPending: matchesLoading,
    isError: matchesQueryError,
    error: matchesErr,
  } = useQuery({
    queryKey: queryKeys.tournaments.matches(tournamentId ?? "__none__"),
    queryFn: ({ signal }) => fetchTournamentMatches(tournamentId, signal),
    enabled: Boolean(tournamentId),
  });

  const matchesError = matchesQueryError && matchesErr instanceof Error ? matchesErr.message : null;

  useEffect(() => {
    if (!tournamentId) return;
    setScheduleDayTimestamps([]);
  }, [tournamentId]);

  const refetchTournament = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.detail(id) });
  }, [queryClient, id]);

  const refreshTournament = useCallback(
    async (nextId: string) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.detail(nextId) });
    },
    [queryClient]
  );

  const refreshMatches = useCallback(
    async (tid: string) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.matches(tid) });
    },
    [queryClient]
  );

  const matchDayOptions = useMemo(
    () => buildMatchDayOptions(tournament?.startDate ?? "", tournament?.endDate ?? ""),
    [tournament?.startDate, tournament?.endDate]
  );

  const matchesDayTimestamps = useMemo(
    () => Array.from(new Set(matches.map((m) => getMatchDayTimestamp(m.scheduledAt)))).sort((a, b) => a - b),
    [matches]
  );

  const scheduleTableDayTimestamps = useMemo(
    () => Array.from(new Set([...scheduleDayTimestamps, ...matchesDayTimestamps])).sort((a, b) => a - b),
    [matchesDayTimestamps, scheduleDayTimestamps]
  );

  const getScheduleDayLabel = useCallback(
    (timestamp: number) =>
      matchDayOptions.find((o) => o.timestamp === timestamp)?.label ?? formatDayOptionLabel(timestamp),
    [matchDayOptions]
  );

  const hasMatchesOutsideTournamentRange = useMemo(() => {
    if (!tournament) return false;
    return matches.some((m) =>
      isScheduledDayOutsideTournamentRange(m.scheduledAt, tournament.startDate, tournament.endDate)
    );
  }, [tournament, matches]);

  const isScheduledDayOutsideTournamentRangeCb = useCallback(
    (scheduledAtIso: string) =>
      tournament
        ? isScheduledDayOutsideTournamentRange(scheduledAtIso, tournament.startDate, tournament.endDate)
        : false,
    [tournament]
  );

  const isDayTimestampOutsideTournamentRangeCb = useCallback(
    (dayTimestamp: number) =>
      tournament
        ? isDayTimestampOutsideTournamentRange(dayTimestamp, tournament.startDate, tournament.endDate)
        : false,
    [tournament]
  );

  return {
    tournament,
    loading,
    error,
    refetchTournament,
    matches,
    matchesLoading,
    matchesError,
    scheduleDayTimestamps,
    setScheduleDayTimestamps,
    matchDayOptions,
    scheduleTableDayTimestamps,
    getScheduleDayLabel,
    refreshTournament,
    refreshMatches,
    hasMatchesOutsideTournamentRange,
    isScheduledDayOutsideTournamentRange: isScheduledDayOutsideTournamentRangeCb,
    isDayTimestampOutsideTournamentRange: isDayTimestampOutsideTournamentRangeCb,
  };
}
