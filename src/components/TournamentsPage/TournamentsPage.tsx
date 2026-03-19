import { useEffect, useState } from "react";
import { Plus, Calendar, MapPin, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import {
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import AppShell from "@/components/AppShell/AppShell";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import type { Tournament } from "@/types";

export default function TournamentsPage() {
  return (
    <ThemeRegistry>
      <AppShell currentPath="/tournaments">
        <TournamentsContent />
      </AppShell>
    </ThemeRegistry>
  );
}

function formatDateRange(start: string, end?: string) {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;

  if (Number.isNaN(startDate.getTime())) {
    return end && !Number.isNaN(endDate?.getTime() ?? NaN) ? (endDate?.toLocaleDateString("pl-PL") ?? "") : "";
  }

  if (!endDate || Number.isNaN(endDate.getTime())) {
    return startDate.toLocaleDateString("pl-PL");
  }

  return `${startDate.toLocaleDateString("pl-PL")} - ${endDate.toLocaleDateString("pl-PL")}`;
}

function TournamentsContent() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tournamentToDelete, setTournamentToDelete] = useState<Tournament | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadTournaments() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/tournaments", { signal: controller.signal });
        if (!res.ok) {
          throw new Error("Nie udało się pobrać turniejów");
        }

        const data: Tournament[] = await res.json();
        if (controller.signal.aborted) return;
        setTournaments(data);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Wystąpił błąd podczas pobierania turniejów");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadTournaments();
    return () => controller.abort();
  }, []);

  function openDeleteDialog(tournament: Tournament) {
    setDeleteError(null);
    setTournamentToDelete(tournament);
  }

  function closeDeleteDialog() {
    if (deleteLoading) return;
    setTournamentToDelete(null);
    setDeleteError(null);
  }

  async function confirmDeleteTournament() {
    if (!tournamentToDelete) return;
    setDeleteLoading(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/tournaments/${tournamentToDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Nie udało się usunąć turnieju");
      }

      setTournaments((prev) => prev.filter((t) => t.id !== tournamentToDelete.id));
      setTournamentToDelete(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Nie udało się usunąć turnieju");
    } finally {
      setDeleteLoading(false);
    }
  }

  function getTournamentStatus(
    startDate: string,
    endDate?: string
  ): { label: string; color: "primary" | "success" | "default" } {
    const now = new Date();
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : start;

    if (now < start) return { label: "Nadchodzący", color: "primary" };
    if (now > end) return { label: "Zakończony", color: "default" };
    return { label: "W trakcie", color: "success" };
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: "bold", mb: 0.5 }}>
            Turnieje
          </Typography>
          <Typography color="textSecondary">Zarządzaj wydarzeniami w tym sezonie.</Typography>
        </Box>
        <Button component="a" href="/tournaments/new" variant="contained" startIcon={<Plus size={20} />}>
          Nowy Turniej
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : tournaments.length === 0 ? (
        <Box
          sx={{
            py: 6,
            textAlign: "center",
            borderRadius: 3,
            border: "1px dashed",
            borderColor: "grey.300",
          }}
        >
          <Typography sx={{ fontWeight: "bold", mb: 1 }}>Brak turniejów</Typography>
          <Typography color="textSecondary">Dodaj pierwszy turniej, aby zacząć planowanie sezonu.</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {tournaments.map((t) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={t.id}>
              <motion.div whileHover={{ y: -5 }}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: 3,
                  }}
                >
                  <CardContent sx={{ flex: 1 }}>
                    <Chip
                      label={getTournamentStatus(t.startDate, t.endDate).label}
                      color={getTournamentStatus(t.startDate, t.endDate).color}
                      size="small"
                      sx={{ mb: 2 }}
                    />
                    <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                      {t.name}
                    </Typography>
                    <Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1,
                        }}
                      >
                        <Calendar size={16} />
                        <Typography variant="body2" color="textSecondary">
                          {formatDateRange(t.startDate, t.endDate)}
                        </Typography>
                      </Box>
                      {t.venue && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <MapPin size={16} />
                          <Typography variant="body2" color="textSecondary">
                            {t.venue.name}
                            {t.venue.address ? `, ${t.venue.address}` : ""}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                  <Box sx={{ p: 1.5, display: "flex", gap: 1 }}>
                    <Button component="a" href={`/tournaments/${t.id}`} variant="outlined" fullWidth size="small">
                      Szczegóły
                    </Button>
                    <Button component="a" href={`/tournaments/${t.id}/edit`} variant="contained" fullWidth size="small">
                      Edytuj
                    </Button>
                    <Tooltip title="Usuń turniej">
                      <span>
                        <IconButton
                          aria-label={`Usuń turniej ${t.name}`}
                          color="error"
                          onClick={() => openDeleteDialog(t)}
                          disabled={deleteLoading && tournamentToDelete?.id === t.id}
                          size="small"
                          sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
                        >
                          <Trash2 size={18} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      )}

      <ConfirmationDialog
        open={Boolean(tournamentToDelete)}
        title="Usunąć turniej?"
        description={
          tournamentToDelete ? (
            <Typography color="textSecondary">
              Ta operacja jest nieodwracalna. Turniej: <strong>{tournamentToDelete.name}</strong>
            </Typography>
          ) : null
        }
        onClose={closeDeleteDialog}
        onConfirm={confirmDeleteTournament}
        loading={deleteLoading}
        errorMessage={deleteError}
        confirmLabel="Usuń"
        cancelLabel="Anuluj"
      />
    </Box>
  );
}
