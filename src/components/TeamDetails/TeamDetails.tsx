import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
  Link as MuiLink,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Dialog,
  DialogContent,
} from "@mui/material";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import AppShell from "@/components/AppShell/AppShell";
import { TeamFormContent } from "@/components/TeamForm/TeamForm";
import type { Team } from "@/types";

interface TeamDetailsProps {
  id: string;
}

export default function TeamDetails({ id }: TeamDetailsProps) {
  return (
    <ThemeRegistry>
      <AppShell currentPath="/settings">
        <TeamDetailsContent id={id} />
      </AppShell>
    </ThemeRegistry>
  );
}

function TeamDetailsContent({ id }: TeamDetailsProps) {
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  // Fetch current team from DB (single team by id)
  useEffect(() => {
    const controller = new AbortController();

    async function fetchTeam() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/teams/${id}`, { signal: controller.signal });
        if (!res.ok) {
          if (res.status === 404) {
            setTeam(null);
            return;
          }
          throw new Error("Nie udało się pobrać drużyny");
        }
        const data: Team = await res.json();
        setTeam(data);
      } catch (fetchError) {
        if (controller.signal.aborted) return;
        setError(fetchError instanceof Error ? fetchError.message : "Wystąpił błąd pobierania");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchTeam();

    return () => controller.abort();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!team) {
    return <Typography>Nie znaleziono drużyny.</Typography>;
  }

  const players = team.players ?? [];
  const staff = team.staff ?? [];

  const handleEditClick = () => setEditOpen(true);

  const handleEditClose = () => setEditOpen(false);

  const handleEditSaved = (updated: Team) => {
    setTeam(updated);
    setEditOpen(false);
  };

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
            href="/settings"
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
            &larr; Powrót do ustawień
          </MuiLink>
          <Typography variant="h3" sx={{ fontWeight: 900 }}>
            {team.name}
          </Typography>
          <Typography color="textSecondary">{team.address ?? "Brak adresu"}</Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button variant="outlined" color="error" sx={{ borderRadius: 4, fontWeight: "bold" }}>
            Usuń Drużynę
          </Button>
          <Button variant="contained" sx={{ borderRadius: 4, fontWeight: "bold" }} onClick={handleEditClick}>
            Edytuj Dane
          </Button>
        </Box>
      </Box>

      <Dialog open={editOpen} onClose={handleEditClose} maxWidth="md" fullWidth>
        <DialogContent sx={{ overflow: "auto", maxHeight: "90vh", p: 0 }}>
          <TeamFormContent mode="edit" initialTeam={team} onSuccess={handleEditSaved} onCancel={handleEditClose} />
        </DialogContent>
      </Dialog>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
          gap: 4,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Paper sx={{ p: 4, borderRadius: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Zawodnicy
              </Typography>
              <Button size="small" color="primary">
                + Dodaj Zawodnika
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "grey.100" }}>
                    <TableCell sx={{ fontWeight: "bold" }}>Imię i Nazwisko</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Klasyfikacja</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Numer</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {players.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4, color: "text.secondary" }}>
                        Brak zawodników w drużynie. Kliknij „Dodaj Zawodnika”, aby dodać.
                      </TableCell>
                    </TableRow>
                  ) : (
                    players.map((p) => (
                      <TableRow key={p.id} hover>
                        <TableCell>
                          {p.firstName} {p.lastName}
                        </TableCell>
                        <TableCell>
                          <Chip label={p.classification?.toFixed(1) ?? "-"} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>{p.number ?? "Nie podano"}</TableCell>
                        <TableCell align="right">
                          <Button size="small" color="primary">
                            Edytuj
                          </Button>
                          <Button size="small" color="error">
                            Usuń
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
              Kontakt
            </Typography>
            <Typography sx={{ fontWeight: "bold" }}>
              {team.contactFirstName ?? "Brak"} {team.contactLastName ?? "danych"}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {team.contactEmail ?? "Brak emaila"}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {team.contactPhone ?? "Brak telefonu"}
            </Typography>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
              Trener & Staff
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    color: "text.secondary",
                    mb: 0.5,
                    display: "block",
                  }}
                >
                  Trener
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {team.coach ? `${team.coach.firstName} ${team.coach.lastName}` : "Nie przypisano"}
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block">
                  {`Email: ${team.coach?.email ?? "Nie podano emaila"}`}
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block">
                  {`Tel.: ${team.coach?.phone ?? "Nie podano telefonu"}`}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    color: "text.secondary",
                    mb: 0.5,
                    display: "block",
                  }}
                >
                  Staff
                </Typography>
                {staff.length > 0 ? (
                  staff.map((s) => (
                    <Typography key={s.id} variant="body2" sx={{ fontWeight: 500 }}>
                      {s.firstName} {s.lastName}
                    </Typography>
                  ))
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    Brak personelu
                  </Typography>
                )}
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    color: "text.secondary",
                    mb: 0.5,
                    display: "block",
                  }}
                >
                  Sędzia
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {/* {team.referee ? `${team.referee.firstName} ${team.referee.lastName}` : "Nie przypisano"} */}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
