import { useQuery } from "@tanstack/react-query";
import { Alert, Avatar, Box, Button, Card, CircularProgress, Grid, IconButton, Typography } from "@mui/material";
import { ChevronRight } from "lucide-react";
import DataLoadAlert from "@/components/ui/DataLoadAlert";
import { fetchTeamsBySeason } from "@/lib/api/teams";
import { queryKeys } from "@/lib/queryKeys";

interface TeamsTabProps {
  seasonId: string | undefined;
}

export default function TeamsTab({ seasonId }: TeamsTabProps) {
  const {
    data: teams = [],
    isPending: loadingTeams,
    isError: teamsQueryFailed,
    error: teamsQueryError,
    refetch: refetchTeams,
  } = useQuery({
    queryKey: queryKeys.teams.bySeason(seasonId || "__none__"),
    queryFn: ({ signal }) => {
      if (!seasonId) return Promise.reject(new Error("Brak sezonu"));
      return fetchTeamsBySeason(seasonId, signal);
    },
    enabled: Boolean(seasonId),
  });

  const teamsError = teamsQueryFailed && teamsQueryError instanceof Error ? teamsQueryError.message : null;

  if (!seasonId) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        Wybierz sezon, aby zobaczyć drużyny.
      </Alert>
    );
  }

  if (loadingTeams) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (teamsError) {
    return <DataLoadAlert message={teamsError} onRetry={() => void refetchTeams()} />;
  }

  if (teams.length === 0) {
    return (
      <Alert
        severity="info"
        sx={{ mb: 2 }}
        action={
          <Button component="a" href="/settings/teams/new" color="inherit" size="small">
            Dodaj drużynę
          </Button>
        }
      >
        Brak drużyn. Dodaj pierwszą drużynę, aby zobaczyć ją na liście.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          Lista Drużyn
        </Typography>
        <Button component="a" href="/settings/teams/new" variant="contained" color="success" size="small">
          + Nowa Drużyna
        </Button>
      </Box>
      <Grid container spacing={2}>
        {teams.map((team) => (
          <Grid size={{ xs: 12, sm: 6 }} key={team.id}>
            <Card sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: "primary.main" }}>{team.name[0] ?? "?"}</Avatar>
                <Box>
                  <Typography sx={{ fontWeight: "bold" }}>{team.name}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {team.players?.length ?? 0} zawodników
                  </Typography>
                </Box>
              </Box>
              <IconButton component="a" href={`/settings/teams/${team.id}`} size="small">
                <ChevronRight />
              </IconButton>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
