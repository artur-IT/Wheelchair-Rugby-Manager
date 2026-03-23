import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Trophy, Users, UserCircle, Calendar, ChevronRight, Plus } from "lucide-react";
import { Box, Button, Grid, Card, CardContent, Typography, Chip, CircularProgress } from "@mui/material";
import AppShell from "@/components/AppShell/AppShell";
import QueryProvider from "@/components/QueryProvider/QueryProvider";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import DataLoadAlert from "@/components/ui/DataLoadAlert";
import { useDefaultSeason } from "@/components/hooks/useDefaultSeason";
import { fetchDashboardSeasonData } from "@/lib/api/dashboard";
import { fetchSeasonById } from "@/lib/api/seasons";
import { queryKeys } from "@/lib/queryKeys";
import { formatTournamentDateRange } from "@/lib/dashboardSeason";
import type { Tournament } from "@/types";

export default function Dashboard() {
  return (
    <QueryProvider>
      <ThemeRegistry>
        <AppShell currentPath="/dashboard">
          <DashboardContent />
        </AppShell>
      </ThemeRegistry>
    </QueryProvider>
  );
}

function DashboardContent() {
  const { defaultSeasonId } = useDefaultSeason();
  const seasonId = defaultSeasonId;

  const {
    data: seasonData,
    isPending: dashboardLoading,
    isError: dashboardIsError,
    error: dashboardErrorObj,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: queryKeys.dashboard.season(seasonId ?? "__none__"),
    queryFn: ({ signal }) => {
      if (!seasonId) {
        return Promise.reject(new Error("Missing season id"));
      }
      return fetchDashboardSeasonData(seasonId, signal);
    },
    enabled: Boolean(seasonId),
  });

  const {
    data: defaultSeason,
    isError: seasonMetaIsError,
    error: seasonMetaErr,
    refetch: refetchSeasonMeta,
    isPending: seasonLoading,
  } = useQuery({
    queryKey: queryKeys.seasons.detail(seasonId ?? "__none__"),
    queryFn: ({ signal }) => {
      if (!seasonId) {
        return Promise.reject(new Error("Missing season id"));
      }
      return fetchSeasonById(seasonId, signal);
    },
    enabled: Boolean(seasonId),
  });

  const upcoming = seasonData?.upcoming ?? [];
  const completed = seasonData?.completed ?? [];
  const partialWarning = seasonData?.partialWarning ?? null;
  const dashboardError = dashboardIsError && dashboardErrorObj instanceof Error ? dashboardErrorObj.message : null;
  const seasonMetaError = seasonMetaIsError && seasonMetaErr instanceof Error ? seasonMetaErr.message : null;

  const statItems = useMemo(() => {
    const stats = seasonData?.stats ?? { tournaments: 0, teams: 0, referees: 0, volunteers: 0 };
    return [
      { label: "Turnieje", value: stats.tournaments, icon: Trophy, color: "#3b82f6" },
      { label: "Drużyny", value: stats.teams, icon: Users, color: "#10b981" },
      { label: "Sędziowie", value: stats.referees, icon: UserCircle, color: "#f59e0b" },
      { label: "Wolontariusze", value: stats.volunteers, icon: UserCircle, color: "#8b5cf6" },
    ] as const;
  }, [seasonData]);

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
              onRetry={() => void refetchSeasonMeta()}
              sx={{ py: 0 }}
            />
          ) : seasonId && seasonLoading ? (
            <CircularProgress size={18} sx={{ ml: 0.5 }} />
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

      {dashboardError ? <DataLoadAlert message={dashboardError} onRetry={() => void refetchDashboard()} /> : null}
      {partialWarning ? (
        <DataLoadAlert message={partialWarning} severity="warning" onRetry={() => void refetchDashboard()} />
      ) : null}

      {dashboardLoading && seasonId ? (
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
                {!seasonId ? (
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
                {!seasonId ? (
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
