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

const DEFAULT_STATS = { tournaments: 0, teams: 0, referees: 0, volunteers: 0 } as const;

const STAT_ITEMS = [
  { key: "tournaments", label: "Turnieje", icon: Trophy, color: "info.main" },
  { key: "teams", label: "Drużyny", icon: Users, color: "secondary.main" },
  { key: "referees", label: "Sędziowie", icon: UserCircle, color: "primary.main" },
  { key: "volunteers", label: "Wolontariusze", icon: UserCircle, color: "warning.main" },
] as const;

const getErrorMessage = (isError: boolean, error: unknown) =>
  isError && error instanceof Error ? error.message : null;

const getSeasonChipLabel = (name: string, year?: number | null) => `${name}${year ? ` (${year})` : ""}`;

function useDashboardSeasonData(seasonId?: string) {
  const dashboardQuery = useQuery({
    queryKey: queryKeys.dashboard.season(seasonId ?? "__none__"),
    queryFn: ({ signal }) => {
      if (!seasonId) {
        return Promise.reject(new Error("Missing season id"));
      }

      return fetchDashboardSeasonData(seasonId, signal);
    },
    enabled: Boolean(seasonId),
  });

  const seasonMetaQuery = useQuery({
    queryKey: queryKeys.seasons.detail(seasonId ?? "__none__"),
    queryFn: ({ signal }) => {
      if (!seasonId) {
        return Promise.reject(new Error("Missing season id"));
      }

      return fetchSeasonById(seasonId, signal);
    },
    enabled: Boolean(seasonId),
  });

  return { dashboardQuery, seasonMetaQuery };
}

function DashboardContent() {
  const { defaultSeasonId } = useDefaultSeason();
  const { dashboardQuery, seasonMetaQuery } = useDashboardSeasonData(defaultSeasonId);

  const {
    data: seasonData,
    isPending: dashboardLoading,
    isError: dashboardIsError,
    error: dashboardErrorObj,
    refetch: refetchDashboard,
  } = dashboardQuery;

  const {
    data: defaultSeason,
    isError: seasonMetaIsError,
    error: seasonMetaErr,
    refetch: refetchSeasonMeta,
    isPending: seasonLoading,
  } = seasonMetaQuery;

  const upcoming = seasonData?.upcoming ?? [];
  const completed = seasonData?.completed ?? [];
  const partialWarning = seasonData?.partialWarning ?? null;
  const dashboardError = getErrorMessage(dashboardIsError, dashboardErrorObj);
  const seasonMetaError = getErrorMessage(seasonMetaIsError, seasonMetaErr);

  const statItems = useMemo(() => {
    const stats = seasonData?.stats ?? DEFAULT_STATS;

    return STAT_ITEMS.map((item) => ({
      ...item,
      value: stats[item.key],
    }));
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
          ) : defaultSeasonId && seasonLoading ? (
            <CircularProgress size={18} sx={{ ml: 0.5 }} />
          ) : defaultSeason ? (
            <Chip
              label={getSeasonChipLabel(defaultSeason.name, defaultSeason.year)}
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

      {dashboardLoading && defaultSeasonId ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <CircularProgress size={32} />
        </Box>
      ) : null}

      <Grid container spacing={3}>
        {statItems.map((stat) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.key}>
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
              <DashboardSectionHeader title="Nadchodzące Turnieje" href="/tournaments" />
              <Box>
                {!defaultSeasonId ? (
                  <DashboardEmptyState message="Ustaw domyślny sezon w Ustawieniach, aby zobaczyć turnieje." />
                ) : upcoming.length === 0 ? (
                  <DashboardEmptyState message="Brak nadchodzących turniejów w tym sezonie." />
                ) : (
                  upcoming.map((t) => (
                    <DashboardTournamentRow key={t.id} tournament={t} calendarIconColor="#FE9A00" />
                  ))
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
                  <QuickActionButton href="/tournaments/new" label="Nowy Turniej" />
                </Grid>
                <Grid size={6}>
                  <QuickActionButton
                    href="/settings/teams/new"
                    label="Nowa Drużyna"
                    sx={{
                      color: "success.main",
                      borderColor: "success.main",
                      "&:hover": {
                        borderColor: "success.dark",
                        bgcolor: "success.50",
                      },
                    }}
                  />
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
              <DashboardSectionHeader title="Zakończone turnieje" href="/tournaments" />
              <Box>
                {!defaultSeasonId ? (
                  <DashboardEmptyState message="Ustaw domyślny sezon w Ustawieniach, aby zobaczyć turnieje." />
                ) : completed.length === 0 ? (
                  <DashboardEmptyState message="Brak zakończonych turniejów w tym sezonie." />
                ) : (
                  completed.map((t) => (
                    <DashboardTournamentRow key={t.id} tournament={t} calendarIconColor="#717171" />
                  ))
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

function DashboardSectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 2,
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
        {title}
      </Typography>
      <Button component="a" href={href} size="small">
        Zobacz wszystkie
      </Button>
    </Box>
  );
}

function DashboardEmptyState({ message }: { message: string }) {
  return (
    <Typography variant="body2" color="text.secondary">
      {message}
    </Typography>
  );
}

function QuickActionButton({ href, label, sx }: { href: string; label: string; sx?: Record<string, unknown> }) {
  return (
    <Button
      component="a"
      href={href}
      variant="outlined"
      fullWidth
      sx={{
        borderStyle: "dashed",
        py: 3,
        flexDirection: "column",
        gap: 1,
        ...sx,
      }}
    >
      <Plus size={24} />
      <Typography variant="caption">{label}</Typography>
    </Button>
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
        bgcolor: "background.paper",
        borderRadius: 1.5,
        border: "1px solid",
        borderColor: "divider",
        textDecoration: "none",
        color: "inherit",
        "&:hover": { bgcolor: "background.default" },
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
      <ChevronRight size={20} style={{ color: "#D4D4D4" }} />
    </Box>
  );
}

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
