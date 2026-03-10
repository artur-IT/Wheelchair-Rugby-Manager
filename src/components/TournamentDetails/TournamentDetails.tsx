import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { Box, Typography, Button, Paper, Link as MuiLink, CircularProgress, Alert } from "@mui/material";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import AppShell from "@/components/AppShell/AppShell";
import { MOCK_TOURNAMENTS, MOCK_REFEREES, MOCK_CLASSIFIERS } from "@/mockData";
import type { Team } from "@/types";

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
  const tournament = MOCK_TOURNAMENTS.find((t) => t.id === id);
  const [teamsFromApi, setTeamsFromApi] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsError, setTeamsError] = useState<string | null>(null);

  // Fetch all teams so we can resolve team IDs to names (when tournament.teams are IDs)
  useEffect(() => {
    if (!tournament) return;
    const controller = new AbortController();
    async function fetchTeams() {
      setTeamsLoading(true);
      setTeamsError(null);
      try {
        const res = await fetch("/api/teams", { signal: controller.signal });
        if (!res.ok) throw new Error("Nie udało się pobrać drużyn");
        const data: Team[] = await res.json();
        setTeamsFromApi(data);
      } catch (err) {
        if (controller.signal.aborted) return;
        setTeamsError(err instanceof Error ? err.message : "Błąd pobierania drużyn");
      } finally {
        if (!controller.signal.aborted) setTeamsLoading(false);
      }
    }
    fetchTeams();
    return () => controller.abort();
  }, [tournament]);

  if (!tournament) {
    return <Typography>Nie znaleziono turnieju.</Typography>;
  }

  // Support both team IDs (string[]) and full Team[] from API
  const teamIdsOrObjects = (tournament.teams ?? []) as (string | Team)[];
  const resolvedTeams: (Team | null)[] = teamIdsOrObjects.map((t) =>
    typeof t === "string" ? (teamsFromApi.find((x) => x.id === t) ?? null) : (t as Team)
  );
  const teamsToShow = resolvedTeams.filter((t): t is Team => t != null);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Box>
          <MuiLink
            href="/tournaments"
            underline="hover"
            sx={{
              color: "primary.main",
              fontWeight: 600,
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              mb: 1,
            }}
          >
            &larr; Powrót do listy
          </MuiLink>
          <Typography variant="h3" sx={{ fontWeight: 900 }}>
            {tournament.name}
          </Typography>
          <Typography color="textSecondary">
            {tournament.startDate} - {tournament.endDate}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button variant="outlined" sx={{ borderRadius: 4, fontWeight: "bold" }}>
            Wyczyść dane
          </Button>
          <Button
            component="a"
            href={`/tournaments/${id}/edit`}
            variant="contained"
            sx={{ borderRadius: 4, fontWeight: "bold" }}
          >
            Edytuj turniej
          </Button>
        </Box>
      </Box>

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
              <Typography sx={{ fontWeight: 600 }}>{tournament.venue.name}</Typography>
              <Typography color="textSecondary" sx={{ mb: 2 }}>
                {tournament.venue.address}
              </Typography>
              <MuiLink
                href={tournament.venue.mapUrl}
                target="_blank"
                rel="noreferrer"
                underline="hover"
                sx={{ fontWeight: "bold", fontSize: "0.875rem" }}
              >
                Otwórz w Mapach &rarr;
              </MuiLink>
            </Paper>

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
              <Typography sx={{ fontWeight: 600 }}>{tournament.accommodation.name}</Typography>
              <Typography color="textSecondary" sx={{ mb: 2 }}>
                {tournament.accommodation.address}
              </Typography>
              <MuiLink
                href={tournament.accommodation.mapUrl}
                target="_blank"
                rel="noreferrer"
                underline="hover"
                sx={{ fontWeight: "bold", fontSize: "0.875rem" }}
              >
                Otwórz w Mapach &rarr;
              </MuiLink>
            </Paper>
          </Box>

          <Paper sx={{ p: 4, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3 }}>
              Plan Rozgrywek
            </Typography>
            <Box
              sx={{
                color: "text.secondary",
                fontStyle: "italic",
                textAlign: "center",
                py: 5,
                border: "2px dashed",
                borderColor: "grey.200",
                borderRadius: 2,
              }}
            >
              Brak zaplanowanych meczów. Dodaj mecze w edycji turnieju.
            </Box>
          </Paper>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
              Drużyny
            </Typography>
            {teamsError ? (
              <Alert severity="error" sx={{ py: 0 }}>
                {teamsError}
              </Alert>
            ) : teamsLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : teamsToShow.length === 0 ? (
              <Typography variant="body2" color="textSecondary">
                Brak przypisanych drużyn.
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {teamsToShow.map((team) => (
                  <Box
                    key={team.id}
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
                      {team.name[0] ?? "?"}
                    </Box>
                    <Typography sx={{ fontWeight: 500 }}>{team.name}</Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
              Personel
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
                </Typography>
                {tournament.referees.map((refOrId) => {
                  const r = typeof refOrId === "string" ? MOCK_REFEREES.find((x) => x.id === refOrId) : refOrId;
                  return r ? (
                    <Typography key={r.id} variant="body2" sx={{ fontWeight: 500 }}>
                      {r.firstName} {r.lastName}
                    </Typography>
                  ) : null;
                })}
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
                </Typography>
                {tournament.classifiers.map((clsOrId) => {
                  const c = typeof clsOrId === "string" ? MOCK_CLASSIFIERS.find((x) => x.id === clsOrId) : clsOrId;
                  return c ? (
                    <Typography key={c.id} variant="body2" sx={{ fontWeight: 500 }}>
                      {c.firstName} {c.lastName}
                    </Typography>
                  ) : null;
                })}
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
