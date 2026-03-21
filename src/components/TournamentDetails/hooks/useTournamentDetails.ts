import { useCallback, useEffect, useMemo, useState } from "react";
import type { SetStateAction } from "react";
import { buildMatchDayOptions, formatDayOptionLabel, getMatchDayTimestamp } from "./matchPlanHelpers";
import type { Match, Tournament } from "@/types";

interface UseTournamentDetailsResult {
  tournament: Tournament | null;
  loading: boolean;
  error: string | null;
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
}

export default function useTournamentDetails(id: string): UseTournamentDetailsResult {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [matches, setMatches] = useState<Match[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);

  const [scheduleDayTimestamps, setScheduleDayTimestamps] = useState<number[]>([]);

  const matchDayOptions = useMemo(
    () => buildMatchDayOptions(tournament?.startDate ?? "", tournament?.endDate ?? ""),
    [tournament?.startDate, tournament?.endDate]
  );

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
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
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }
    load();
    return () => controller.abort();
  }, [id]);

  const refreshTournament = useCallback(async (nextId: string) => {
    const controller = new AbortController();
    try {
      const refreshed = await fetch(`/api/tournaments/${nextId}`, { signal: controller.signal });
      if (refreshed.status === 404) {
        setTournament(null);
        return;
      }
      if (!refreshed.ok) throw new Error("Nie udało się odświeżyć turnieju");
      const updated: Tournament = await refreshed.json();
      setTournament(updated);
    } catch (err) {
      if (controller.signal.aborted) return;
      throw err;
    }
  }, []);

  const refreshMatches = useCallback(async (tournamentId: string) => {
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
  }, []);

  useEffect(() => {
    const tournamentId = tournament?.id;
    if (!tournamentId) return;
    setScheduleDayTimestamps([]);
    void refreshMatches(tournamentId);
  }, [refreshMatches, tournament?.id]);

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

  return {
    tournament,
    loading,
    error,
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
  };
}
