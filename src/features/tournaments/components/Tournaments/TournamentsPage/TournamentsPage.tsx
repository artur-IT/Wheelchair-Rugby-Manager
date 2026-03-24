import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
  IconButton,
  Tooltip,
} from "@mui/material";
import AppShell from "@/components/AppShell/AppShell";
import QueryProvider from "@/components/QueryProvider/QueryProvider";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import DataLoadAlert from "@/components/ui/DataLoadAlert";
import { deleteTournamentById, fetchTournamentsList } from "@/lib/api/tournaments";
import { formatAddressForDisplay } from "@/lib/addressDisplay";
import { formatDateRangePl } from "@/lib/dateFormat";
import { queryKeys } from "@/lib/queryKeys";
import type { Tournament } from "@/types";

export default function TournamentsPage() {
  return (
    <QueryProvider>
      <ThemeRegistry>
        <AppShell currentPath="/tournaments">
          <TournamentsContent />
        </AppShell>
      </ThemeRegistry>
    </QueryProvider>
  );
}

function TournamentsContent() {
  const queryClient = useQueryClient();
  const [tournamentToDelete, setTournamentToDelete] = useState<Tournament | null>(null);

  const {
    data: tournaments = [],
    isPending: loading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.tournaments.list(),
    queryFn: ({ signal }) => fetchTournamentsList(signal),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTournamentById,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.list() });
      setTournamentToDelete(null);
    },
  });

  const listError = isError && error instanceof Error ? error.message : null;

  function openDeleteDialog(tournament: Tournament) {
    if (deleteMutation.isPending) return;
    deleteMutation.reset();
    setTournamentToDelete(tournament);
  }

  function closeDeleteDialog() {
    if (deleteMutation.isPending) return;
    deleteMutation.reset();
    setTournamentToDelete(null);
  }

  function confirmDeleteTournament() {
    if (!tournamentToDelete) return;
    deleteMutation.mutate(tournamentToDelete.id);
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

  const deleteErrorMessage = deleteMutation.error instanceof Error ? deleteMutation.error.message : null;

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

      <DataLoadAlert message={listError} onRetry={() => void refetch()} sx={{ mb: 3 }} />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : isError ? null : tournaments.length === 0 ? (
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
                          {formatDateRangePl(t.startDate, t.endDate)}
                        </Typography>
                      </Box>
                      {t.venue && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <MapPin size={16} />
                          <Typography variant="body2" color="textSecondary">
                            {t.venue.name}
                            {t.venue.address ? `, ${formatAddressForDisplay(t.venue.address, ", ")}` : ""}
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
                          disabled={deleteMutation.isPending && tournamentToDelete?.id === t.id}
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
        loading={deleteMutation.isPending}
        errorMessage={deleteErrorMessage}
        confirmLabel="Usuń"
        cancelLabel="Anuluj"
      />
    </Box>
  );
}
