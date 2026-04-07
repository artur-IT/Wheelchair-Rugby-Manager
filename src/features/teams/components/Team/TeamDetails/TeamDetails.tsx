import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Link,
} from "@mui/material";
import AppShell from "@/components/AppShell/AppShell";
import QueryProvider from "@/components/QueryProvider/QueryProvider";
import {
  buildPlayerPayloadFromEntity,
  parseOptionalNumber,
  toWebsiteHref,
} from "@/features/teams/components/Team/shared/teamFormUtils";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import { TeamFormContent } from "@/features/teams/components/Team/TeamForm/TeamForm";
import TeamNewPlayer, { type PlayerRow } from "@/features/teams/components/Team/TeamNewPlayer/TeamNewPlayer";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import DataLoadAlert from "@/components/ui/DataLoadAlert";
import { blurActiveElement } from "@/lib/a11y/blurActiveElement";
import { deleteTeamById, fetchTeamById, updateTeamById } from "@/lib/api/teams";
import { queryKeys } from "@/lib/queryKeys";
import { playerClassificationSchema } from "@/lib/validateInputs";
import type { Team, Player } from "@/types";

const MAX_PLAYER_NUMBER = 99;
const playerNumberLimitError = `Numer zawodnika nie może być większy niż ${MAX_PLAYER_NUMBER}`;

function getPlayerNumberError(number?: number) {
  if (number === undefined || number === null) return null;
  if (number < 0) return "Numer zawodnika nie może być ujemny";
  return number > MAX_PLAYER_NUMBER ? playerNumberLimitError : null;
}

function getPlayerClassificationError(classification?: number) {
  if (classification === undefined || classification === null) return null;
  const result = playerClassificationSchema.safeParse(classification);
  return result.success ? null : (result.error.issues[0]?.message ?? "Nieprawidłowa klasyfikacja");
}

function getDuplicatePlayerNumberError(
  playersPayload: { firstName: string; lastName: string; classification?: number; number?: number }[]
) {
  const seenNumbers = new Set<number>();
  for (const player of playersPayload) {
    if (player.number === undefined) continue;
    if (seenNumbers.has(player.number)) {
      return `Numer ${player.number} jest już zajęty w tej drużynie`;
    }
    seenNumbers.add(player.number);
  }
  return null;
}

const toEditForm = (player: Player) => ({
  firstName: player.firstName,
  lastName: player.lastName,
  classification: player.classification != null ? String(player.classification) : "",
  number: player.number != null ? String(player.number) : "",
});

/** Build PUT /api/teams/:id body from team and new players list (ids omitted; backend replaces all players). */
function buildTeamUpdateBody(
  team: Team,
  players: { firstName: string; lastName: string; classification?: number; number?: number }[]
) {
  // Keep this payload minimal, so editing players does not validate unrelated team contact fields.
  return {
    name: team.name,
    players,
  };
}

interface TeamDetailsProps {
  id: string;
}

export default function TeamDetails({ id }: TeamDetailsProps) {
  return (
    <QueryProvider>
      <ThemeRegistry>
        <AppShell currentPath="/settings">
          <TeamDetailsContent id={id} />
        </AppShell>
      </ThemeRegistry>
    </QueryProvider>
  );
}

function TeamDetailsContent({ id }: TeamDetailsProps) {
  const queryClient = useQueryClient();
  const teamQueryKey = queryKeys.teams.detail(id);

  const {
    data: team,
    isPending: loading,
    isError,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: teamQueryKey,
    queryFn: ({ signal }) => fetchTeamById(id, signal),
  });

  const deleteTeamMutation = useMutation({
    mutationFn: deleteTeamById,
    onSuccess: () => {
      blurActiveElement();
      window.location.assign("/settings");
    },
  });
  const updatePlayersMutation = useMutation({
    mutationFn: async (
      playersPayload: {
        firstName: string;
        lastName: string;
        classification?: number;
        number?: number;
      }[]
    ) => {
      if (!team) throw new Error("Nie znaleziono drużyny");
      return updateTeamById(team.id, buildTeamUpdateBody(team, playersPayload));
    },
  });

  const setTeamInCache = (updated: Team) => {
    queryClient.setQueryData(teamQueryKey, updated);
  };

  const [editOpen, setEditOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [deleteConfirmPlayer, setDeleteConfirmPlayer] = useState<Player | null>(null);
  const [playerActionError, setPlayerActionError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    firstName: string;
    lastName: string;
    classification: string;
    number: string;
  } | null>(null);
  const [addingNewPlayer, setAddingNewPlayer] = useState(false);
  const [newPlayerForm, setNewPlayerForm] = useState<PlayerRow | null>(null);
  const [deleteTeamDialogOpen, setDeleteTeamDialogOpen] = useState(false);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    const message = queryError instanceof Error ? queryError.message : "Wystąpił błąd pobierania";
    return <DataLoadAlert message={message} onRetry={() => void refetch()} />;
  }

  if (!team) {
    return <Typography>Nie znaleziono drużyny.</Typography>;
  }

  const players = team.players ?? [];
  const staff = team.staff ?? [];

  const handleEditClick = () => setEditOpen(true);

  const handleEditClose = () => {
    blurActiveElement();
    setEditOpen(false);
  };

  const handleEditSaved = (updated: Team) => {
    setTeamInCache(updated);
    blurActiveElement();
    setEditOpen(false);
  };

  const handleDeleteTeamClick = () => {
    deleteTeamMutation.reset();
    setDeleteTeamDialogOpen(true);
  };

  const handleDeleteTeamClose = () => {
    if (deleteTeamMutation.isPending) return;
    blurActiveElement();
    deleteTeamMutation.reset();
    setDeleteTeamDialogOpen(false);
  };

  const handleDeleteTeamConfirm = () => {
    if (!team) return;
    deleteTeamMutation.mutate(team.id);
  };

  const deleteTeamErrorMessage = deleteTeamMutation.error instanceof Error ? deleteTeamMutation.error.message : null;

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setEditForm(toEditForm(player));
  };

  const handleEditPlayerClose = () => {
    blurActiveElement();
    updatePlayersMutation.reset();
    setEditingPlayer(null);
    setEditForm(null);
    setPlayerActionError(null);
  };

  const handleDeletePlayerClick = (player: Player) => setDeleteConfirmPlayer(player);
  const handleDeleteConfirmClose = () => {
    blurActiveElement();
    updatePlayersMutation.reset();
    setDeleteConfirmPlayer(null);
    setPlayerActionError(null);
  };

  const updateTeamPlayers = async (
    playersPayload: { firstName: string; lastName: string; classification?: number; number?: number }[]
  ): Promise<boolean> => {
    if (!team) return false;
    updatePlayersMutation.reset();
    setPlayerActionError(null);
    try {
      const updated = await updatePlayersMutation.mutateAsync(playersPayload);
      setTeamInCache(updated);
      return true;
    } catch (e) {
      setPlayerActionError(e instanceof Error ? e.message : "Wystąpił błąd");
      return false;
    }
  };

  const handleEditPlayerSave = async () => {
    if (!team || !editingPlayer || !editForm) return;
    const firstName = editForm.firstName.trim();
    const lastName = editForm.lastName.trim();
    if (!firstName || !lastName) {
      setPlayerActionError("Imię i nazwisko są wymagane");
      return;
    }
    const classification = parseOptionalNumber(editForm.classification);
    const classificationError = getPlayerClassificationError(classification);
    if (classificationError) {
      setPlayerActionError(classificationError);
      return;
    }
    const number = parseOptionalNumber(editForm.number);
    const numberError = getPlayerNumberError(number);
    if (numberError) {
      setPlayerActionError(numberError);
      return;
    }
    const playersPayload = (team.players ?? []).map((p) =>
      p.id === editingPlayer.id ? { id: p.id, firstName, lastName, classification, number } : buildPlayerPayloadFromEntity(p)
    );
    const duplicateNumberError = getDuplicatePlayerNumberError(playersPayload);
    if (duplicateNumberError) {
      setPlayerActionError(duplicateNumberError);
      return;
    }
    const success = await updateTeamPlayers(playersPayload);
    if (success) {
      handleEditPlayerClose();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!team || !deleteConfirmPlayer) return;
    const playersPayload = (team.players ?? [])
      .filter((p) => p.id !== deleteConfirmPlayer.id)
      .map(buildPlayerPayloadFromEntity);
    const success = await updateTeamPlayers(playersPayload);
    if (success) {
      handleDeleteConfirmClose();
    }
  };

  const handleAddNewPlayerClick = () => {
    setNewPlayerForm({
      id: crypto.randomUUID(),
      firstName: "",
      lastName: "",
      classification: undefined,
      number: undefined,
    });
    setAddingNewPlayer(true);
  };

  const handleAddPlayerClose = () => {
    blurActiveElement();
    updatePlayersMutation.reset();
    setAddingNewPlayer(false);
    setNewPlayerForm(null);
    setPlayerActionError(null);
  };

  const handleAddPlayerSave = async () => {
    if (!team || !newPlayerForm) return;
    const firstName = newPlayerForm.firstName.trim();
    const lastName = newPlayerForm.lastName.trim();
    if (!firstName || !lastName) {
      setPlayerActionError("Imię i nazwisko są wymagane");
      return;
    }
    const classification = newPlayerForm.classification ?? undefined;
    const classificationError = getPlayerClassificationError(classification ?? undefined);
    if (classificationError) {
      setPlayerActionError(classificationError);
      return;
    }
    const number = newPlayerForm.number != null ? Number(newPlayerForm.number) : undefined;
    const numberError = getPlayerNumberError(number);
    if (numberError) {
      setPlayerActionError(numberError);
      return;
    }
    const playersPayload = [
      ...(team.players ?? []).map(buildPlayerPayloadFromEntity),
      { firstName, lastName, classification, number },
    ];
    const duplicateNumberError = getDuplicatePlayerNumberError(playersPayload);
    if (duplicateNumberError) {
      setPlayerActionError(duplicateNumberError);
      return;
    }
    const success = await updateTeamPlayers(playersPayload);
    if (success) {
      handleAddPlayerClose();
    }
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
          <Typography variant="h3" sx={{ fontWeight: 900, color: "info.main" }}>
            {team.name}
          </Typography>
          {team.websiteUrl ? (
            <Link href={toWebsiteHref(team.websiteUrl)} target="_blank" rel="noreferrer" underline="hover">
              <Typography color="textSecondary">{team.websiteUrl}</Typography>
            </Link>
          ) : (
            <Typography color="textSecondary">Nie podano strony internetowej</Typography>
          )}
          <Typography color="textSecondary">
            {team.city && team.postalCode ? `${team.postalCode} ${team.city} ` : "Nie podano miasta"}
          </Typography>
          <Typography color="textSecondary">{team.address ?? "Nie podano adresu"}</Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            variant="outlined"
            color="error"
            sx={{ borderRadius: 4, fontWeight: "bold" }}
            onClick={handleDeleteTeamClick}
          >
            Usuń Drużynę
          </Button>
          <Button variant="contained" sx={{ borderRadius: 4, fontWeight: "bold" }} onClick={handleEditClick}>
            Edytuj Dane
          </Button>
        </Box>
      </Box>

      <Dialog open={editOpen} onClose={handleEditClose} maxWidth="sm" fullWidth disableRestoreFocus>
        <DialogContent sx={{ overflow: "auto", maxHeight: "90vh", p: 0 }}>
          <TeamFormContent mode="edit" initialTeam={team} onSuccess={handleEditSaved} onCancel={handleEditClose} />
        </DialogContent>
      </Dialog>

      {/* Add new player dialog */}
      <TeamNewPlayer
        open={addingNewPlayer}
        onClose={handleAddPlayerClose}
        onSave={handleAddPlayerSave}
        playerActionError={playerActionError}
        playerActionLoading={updatePlayersMutation.isPending}
        newPlayerForm={newPlayerForm}
        setNewPlayerForm={setNewPlayerForm}
      />

      {/* Edit player dialog */}
      <Dialog open={!!editingPlayer} onClose={handleEditPlayerClose} maxWidth="xs" fullWidth disableRestoreFocus>
        <DialogTitle>Edytuj zawodnika</DialogTitle>
        <DialogContent>
          {playerActionError && (
            <Alert severity="error" sx={{ mt: 1, mb: 1 }}>
              {playerActionError}
            </Alert>
          )}
          {editForm && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
              <TextField
                label="Imię"
                value={editForm.firstName}
                onChange={(e) => setEditForm((f) => (f ? { ...f, firstName: e.target.value } : f))}
                fullWidth
                size="small"
              />
              <TextField
                label="Nazwisko"
                value={editForm.lastName}
                onChange={(e) => setEditForm((f) => (f ? { ...f, lastName: e.target.value } : f))}
                fullWidth
                size="small"
              />
              <TextField
                label="Klasyfikacja"
                type="number"
                inputProps={{ inputMode: "decimal" }}
                value={editForm.classification}
                onChange={(e) => setEditForm((f) => (f ? { ...f, classification: e.target.value } : f))}
                fullWidth
                size="small"
              />
              <TextField
                label="Numer"
                type="number"
                inputProps={{ inputMode: "numeric" }}
                value={editForm.number}
                onChange={(e) => setEditForm((f) => (f ? { ...f, number: e.target.value } : f))}
                fullWidth
                size="small"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditPlayerClose} disabled={updatePlayersMutation.isPending}>
            Anuluj
          </Button>
          <Button
            variant="contained"
            onClick={handleEditPlayerSave}
            disabled={updatePlayersMutation.isPending || !editForm}
          >
            {updatePlayersMutation.isPending ? <CircularProgress size={24} /> : "Zapisz"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete player dialog */}
      <ConfirmationDialog
        open={Boolean(deleteConfirmPlayer)}
        onClose={handleDeleteConfirmClose}
        onConfirm={handleDeleteConfirm}
        loading={updatePlayersMutation.isPending}
        title="Usuń zawodnika"
        description={
          <Typography>
            Czy na pewno chcesz usunąć
            {deleteConfirmPlayer ? ` ${deleteConfirmPlayer.firstName} ${deleteConfirmPlayer.lastName}` : ""} z drużyny?
          </Typography>
        }
        errorMessage={playerActionError}
      />

      <ConfirmationDialog
        open={deleteTeamDialogOpen}
        onClose={handleDeleteTeamClose}
        onConfirm={handleDeleteTeamConfirm}
        loading={deleteTeamMutation.isPending}
        title="Usuń drużynę"
        description={
          <Typography>
            Operacja usunie drużynę <strong>{team.name}</strong> z bazy danych. Czy na pewno chcesz kontynuować?
          </Typography>
        }
        errorMessage={deleteTeamErrorMessage}
        confirmLabel="Usuń drużynę"
      />

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
              <Button size="small" color="primary" onClick={handleAddNewPlayerClick}>
                + Dodaj Zawodnika
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "background.default" }}>
                    <TableCell sx={{ fontWeight: "bold" }}>Imię i Nazwisko</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Klasyfikacja</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Numer</TableCell>
                    <TableCell sx={{ fontWeight: "bold", textAlign: "center" }}>Operacje</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {players.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4, color: "text.secondary" }}>
                        Brak zawodników w drużynie.
                      </TableCell>
                    </TableRow>
                  ) : (
                    players.map((p) => (
                      <TableRow key={p.id} hover>
                        <TableCell>
                          {p.firstName} {p.lastName}
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={p.classification?.toFixed(1) ?? "-"} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="center">{p.number ?? "Nie podano"}</TableCell>
                        <TableCell align="center">
                          <Button size="small" color="primary" onClick={() => handleEditPlayer(p)}>
                            Edytuj
                          </Button>
                          <Button size="small" color="error" onClick={() => handleDeletePlayerClick(p)}>
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
              {team.contactFirstName && team.contactLastName
                ? `${team.contactFirstName} ${team.contactLastName}`
                : "Brak danych"}
            </Typography>{" "}
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
                  {team.referee ? `${team.referee.firstName} ${team.referee.lastName}` : "Nie przypisano"}
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block">
                  {`Email: ${team.referee?.email ?? "-"}`}
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block">
                  {`Tel.: ${team.referee?.phone ?? "-"}`}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
