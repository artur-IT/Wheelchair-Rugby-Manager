import { useEffect, useMemo, useState } from "react";
import { Trophy, Users, UserCircle, Calendar, ChevronRight, Plus } from "lucide-react";
import { Box, Button, Grid, Card, CardContent, Typography, Chip, CircularProgress } from "@mui/material";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import AppShell from "@/components/AppShell/AppShell";
import DataLoadAlert from "@/components/ui/DataLoadAlert";
import { useDefaultSeason } from "@/components/hooks/useDefaultSeason";
import { getErrorMessageFromResponse } from "@/lib/apiHttp";
import {
  formatTournamentDateRange,
  isTournamentCompleted,
  isTournamentOngoingOrUpcoming,
  sortTournamentsByEndDateDesc,
  sortTournamentsByStartDate,
  totalVolunteersAcrossTournaments,
} from "@/lib/dashboardSeason";
import type { Season, Tournament } from "@/types";

function useDashboardSeasonData(seasonId: string | null, loadNonce: number) {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ tournaments: 0, teams: 0, referees: 0, volunteers: 0 });
  const [upcoming, setUpcoming] = useState<Tournament[]>([]);
  const [completed, setCompleted] = useState<Tournament[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [partialWarning, setPartialWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!seasonId) {
      setStats({ tournaments: 0, teams: 0, referees: 0, volunteers: 0 });
      setUpcoming([]);
      setCompleted([]);
      setError(null);
      setPartialWarning(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setPartialWarning(null);

    (async () => {
      try {
        const [tRes, teamsRes, refRes] = await Promise.all([
          fetch("/api/tournaments", { signal: controller.signal }),
          fetch(`/api/teams?seasonId=${encodeURIComponent(seasonId)}`, { signal: controller.signal }),
          fetch(`/api/referees?seasonId=${encodeURIComponent(seasonId)}`, { signal: controller.signal }),
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
          if (!controller.signal.aborted) {
            setError(msg);
            setStats({ tournaments: 0, teams: 0, referees: 0, volunteers: 0 });
            setUpcoming([]);
            setCompleted([]);
          }
          return;
        }

        if (failed.length > 0) {
          setPartialWarning(`Nie udało się załadować danych: ${failed.join(", ")}. Poniższe liczby mogą być niepełne.`);
        }

        const list = (Array.isArray(rawTournaments) ? rawTournaments : []) as Tournament[];
        const forSeason = list.filter((t) => t.seasonId === seasonId);

        setStats({
          tournaments: forSeason.length,
          teams: Array.isArray(teamsJson) ? teamsJson.length : 0,
          referees: Array.isArray(refereesJson) ? refereesJson.length : 0,
          volunteers: totalVolunteersAcrossTournaments(forSeason),
        });
        setUpcoming(sortTournamentsByStartDate(forSeason.filter((t) => isTournamentOngoingOrUpcoming(t))));
        setCompleted(sortTournamentsByEndDateDesc(forSeason.filter((t) => isTournamentCompleted(t))));
      } catch {
        if (!controller.signal.aborted) {
          setError("Nie udało się załadować danych pulpitu. Sprawdź połączenie.");
          setStats({ tournaments: 0, teams: 0, referees: 0, volunteers: 0 });
          setUpcoming([]);
          setCompleted([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, [seasonId, loadNonce]);

  return { loading, stats, upcoming, completed, error, partialWarning };
}

export default function Dashboard() {
  return (
    <ThemeRegistry>
      <AppShell currentPath="/dashboard">
        <DashboardContent />
      </AppShell>
    </ThemeRegistry>
  );
}

function DashboardContent() {
  const { defaultSeasonId } = useDefaultSeason();
  const [defaultSeason, setDefaultSeason] = useState<Season | null>(null);
  const [seasonMetaError, setSeasonMetaError] = useState<string | null>(null);
  const [seasonMetaNonce, setSeasonMetaNonce] = useState(0);
  const [loadNonce, setLoadNonce] = useState(0);
  const {
    loading,
    stats,
    upcoming,
    completed,
    error: dashboardError,
    partialWarning,
  } = useDashboardSeasonData(defaultSeasonId, loadNonce);

  const statItems = useMemo(
    () =>
      [
        { label: "Turnieje", value: stats.tournaments, icon: Trophy, color: "#3b82f6" },
        { label: "Drużyny", value: stats.teams, icon: Users, color: "#10b981" },
        { label: "Sędziowie", value: stats.referees, icon: UserCircle, color: "#f59e0b" },
        { label: "Wolontariusze", value: stats.volunteers, icon: UserCircle, color: "#8b5cf6" },
      ] as const,
    [stats]
  );

  useEffect(() => {
    if (!defaultSeasonId) {
      setDefaultSeason(null);
      setSeasonMetaError(null);
      return;
    }
    const controller = new AbortController();
    setSeasonMetaError(null);
    fetch(`/api/seasons/${defaultSeasonId}`, { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) {
          const msg = await getErrorMessageFromResponse(r, "Nie udało się pobrać sezonu.");
          if (!controller.signal.aborted) {
            setSeasonMetaError(msg);
            setDefaultSeason(null);
          }
          return;
        }
        const data: Season = await r.json();
        if (!controller.signal.aborted) setDefaultSeason(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setSeasonMetaError("Nie udało się pobrać nazwy sezonu. Sprawdź połączenie.");
          setDefaultSeason(null);
        }
      });
    return () => controller.abort();
  }, [defaultSeasonId, seasonMetaNonce]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
          Witaj, Organizatorze!
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5, flexWrap: "wrap" }}>
          <Typography color="textSecondary">Oto podsumowanie sezonu:</Typography>
          {seasonMetaError ? (
            <DataLoadAlert
              message={seasonMetaError}
              severity="warning"
              onRetry={() => setSeasonMetaNonce((n) => n + 1)}
              sx={{ py: 0 }}
            />
          ) : defaultSeason ? (
            <Chip
              label={`${defaultSeason.name}${defaultSeason.year ? ` (${defaultSeason.year})` : ""}`}
              size="small"
              color="warning"
              component="a"
              href="/settings"
              clickable
            />
          ) : (
            <Typography
              component="a"
              href="/settings"
              variant="caption"
              color="textSecondary"
              sx={{ textDecoration: "underline", cursor: "pointer" }}
            >
              Brak domyślnego sezonu — ustaw w Ustawieniach
            </Typography>
          )}
        </Box>
      </Box>

      {dashboardError ? <DataLoadAlert message={dashboardError} onRetry={() => setLoadNonce((n) => n + 1)} /> : null}
      {partialWarning ? (
        <DataLoadAlert message={partialWarning} severity="warning" onRetry={() => setLoadNonce((n) => n + 1)} />
      ) : null}

      {loading && defaultSeasonId ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <CircularProgress size={32} />
        </Box>
      ) : null}

      <Grid container spacing={3}>
        {statItems.map((stat, i) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    bgcolor: stat.color,
                    p: 1.5,
                    borderRadius: 2,
                    color: "white",
                  }}
                >
                  <stat.icon size={20} />
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "text.secondary",
                    }}
                  >
                    {stat.label}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                    {stat.value}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  Nadchodzące Turnieje
                </Typography>
                <Button component="a" href="/tournaments" size="small">
                  Zobacz wszystkie
                </Button>
              </Box>
              <Box>
                {!defaultSeasonId ? (
                  <Typography variant="body2" color="text.secondary">
                    Ustaw domyślny sezon w Ustawieniach, aby zobaczyć turnieje.
                  </Typography>
                ) : upcoming.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Brak nadchodzących turniejów w tym sezonie.
                  </Typography>
                ) : (
                  upcoming.map((t) => <DashboardTournamentRow key={t.id} tournament={t} calendarIconColor="#4f46e5" />)
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                Szybkie Akcje
              </Typography>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <Button
                    component="a"
                    href="/tournaments/new"
                    variant="outlined"
                    fullWidth
                    sx={{
                      borderStyle: "dashed",
                      py: 3,
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    <Plus size={24} />
                    <Typography variant="caption">Nowy Turniej</Typography>
                  </Button>
                </Grid>
                <Grid size={6}>
                  <Button
                    component="a"
                    href="/settings/teams/new"
                    variant="outlined"
                    fullWidth
                    sx={{
                      borderStyle: "dashed",
                      py: 3,
                      flexDirection: "column",
                      gap: 1,
                      color: "success.main",
                      borderColor: "success.main",
                      "&:hover": {
                        borderColor: "success.dark",
                        bgcolor: "success.50",
                      },
                    }}
                  >
                    <Plus size={24} />
                    <Typography variant="caption">Nowa Drużyna</Typography>
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  Zakończone turnieje
                </Typography>
                <Button component="a" href="/tournaments" size="small">
                  Zobacz wszystkie
                </Button>
              </Box>
              <Box>
                {!defaultSeasonId ? (
                  <Typography variant="body2" color="text.secondary">
                    Ustaw domyślny sezon w Ustawieniach, aby zobaczyć turnieje.
                  </Typography>
                ) : completed.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Brak zakończonych turniejów w tym sezonie.
                  </Typography>
                ) : (
                  completed.map((t) => <DashboardTournamentRow key={t.id} tournament={t} calendarIconColor="#64748b" />)
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

function DashboardTournamentRow({
  tournament: t,
  calendarIconColor,
}: {
  tournament: Tournament;
  calendarIconColor: string;
}) {
  return (
    <Box
      component="a"
      href={`/tournaments/${t.id}`}
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        p: 2,
        mb: 1,
        bgcolor: "grey.50",
        borderRadius: 1.5,
        border: "1px solid",
        borderColor: "grey.200",
        textDecoration: "none",
        color: "inherit",
        "&:hover": { bgcolor: "grey.100" },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{ bgcolor: "white", p: 1, borderRadius: 1 }}>
          <Calendar size={20} style={{ color: calendarIconColor }} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: "bold" }}>{t.name}</Typography>
          <Typography variant="caption" color="textSecondary">
            {formatTournamentDateRange(t.startDate, t.endDate)}
          </Typography>
        </Box>
      </Box>
      <ChevronRight size={20} style={{ color: "#cbd5e1" }} />
    </Box>
  );
}
