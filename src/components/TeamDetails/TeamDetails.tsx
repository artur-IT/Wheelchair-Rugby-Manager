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
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Link,
} from "@mui/material";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import AppShell from "@/components/AppShell/AppShell";
import { TeamFormContent } from "@/components/TeamForm/TeamForm";
import TeamNewPlayer, { type PlayerRow } from "@/components/TeamNewPlayer/TeamNewPlayer";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import type { Team, Player } from "@/types";

const MAX_PLAYER_NUMBER = 99;
const playerNumberLimitError = `Numer zawodnika nie może być większy niż ${MAX_PLAYER_NUMBER}`;

function getPlayerNumberError(number?: number) {
  if (number === undefined || number === null) return null;
  return number > MAX_PLAYER_NUMBER ? playerNumberLimitError : null;
}

/** Build PUT /api/teams/:id body from team and new players list (ids omitted; backend replaces all players). */
function buildTeamUpdateBody(
  team: Team,
  players: { firstName: string; lastName: string; classification?: number; number?: number }[]
) {
  return {
    name: team.name,
    address: team.address,
    websiteUrl: team.websiteUrl ?? undefined,
    contactFirstName: team.contactFirstName,
    contactLastName: team.contactLastName,
    contactEmail: team.contactEmail,
    contactPhone: team.contactPhone,
    seasonId: team.seasonId,
    coachId: team.coachId ?? undefined,
    refereeId: team.refereeId ?? undefined,
    staff: (team.staff ?? []).map((s) => ({ firstName: s.firstName, lastName: s.lastName })),
    players,
  };
}

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
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [deleteConfirmPlayer, setDeleteConfirmPlayer] = useState<Player | null>(null);
  const [playerActionLoading, setPlayerActionLoading] = useState(false);
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
  const [deleteTeamLoading, setDeleteTeamLoading] = useState(false);
  const [deleteTeamError, setDeleteTeamError] = useState<string | null>(null);

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

  useEffect(() => {
    if (editingPlayer) {
      setEditForm({
        firstName: editingPlayer.firstName,
        lastName: editingPlayer.lastName,
        classification: editingPlayer.classification != null ? String(editingPlayer.classification) : "",
        number: editingPlayer.number != null ? String(editingPlayer.number) : "",
      });
    } else {
      setEditForm(null);
    }
  }, [editingPlayer]);

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

  const handleDeleteTeamClick = () => {
    setDeleteTeamError(null);
    setDeleteTeamDialogOpen(true);
  };

  const handleDeleteTeamClose = () => {
    setDeleteTeamDialogOpen(false);
    setDeleteTeamError(null);
  };

  // Delete team record and redirect back to settings on success.
  const handleDeleteTeamConfirm = async () => {
    if (!team) return;
    setDeleteTeamLoading(true);
    setDeleteTeamError(null);
    try {
      const res = await fetch(`/api/teams/${team.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error ?? "Nie udało się usunąć drużyny");
      }
      window.location.href = "/settings";
    } catch (err) {
      setDeleteTeamError(err instanceof Error ? err.message : "Wystąpił błąd podczas usuwania drużyny");
    } finally {
      setDeleteTeamLoading(false);
    }
  };

  // const handleEditPlayer = (player: Player) => setEditingPlayer(player); good old code (before Code Rabbit)
  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setEditForm({
      firstName: player.firstName,
      lastName: player.lastName,
      classification: player.classification != null ? String(player.classification) : "",
      number: player.number != null ? String(player.number) : "",
    });
  };

  const handleEditPlayerClose = () => {
    setEditingPlayer(null);
    setPlayerActionError(null);
  };

  const handleDeletePlayerClick = (player: Player) => setDeleteConfirmPlayer(player);
  const handleDeleteConfirmClose = () => {
    setDeleteConfirmPlayer(null);
    setPlayerActionError(null);
  };

  const updateTeamPlayers = async (
    playersPayload: { firstName: string; lastName: string; classification?: number; number?: number }[]
  ): Promise<boolean> => {
    if (!team) return false;
    setPlayerActionLoading(true);
    setPlayerActionError(null);
    try {
      const res = await fetch(`/api/teams/${team.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildTeamUpdateBody(team, playersPayload)),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        // Zod flatten() puts field errors in fieldErrors, generic in formErrors
        const fieldErrors = err?.error?.fieldErrors;
        const firstFieldError = fieldErrors ? Object.values(fieldErrors).flat()[0] : undefined;
        throw new Error(
          firstFieldError ?? err?.error?.formErrors?.[0] ?? err?.error ?? "Nie udało się zaktualizować drużyny"
        );
      }
      const updated: Team = await res.json();
      setTeam(updated);
      return true;
    } catch (e) {
      setPlayerActionError(e instanceof Error ? e.message : "Wystąpił błąd");
      return false;
    } finally {
      setPlayerActionLoading(false);
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
    const classification =
      editForm.classification.trim() !== "" && !Number.isNaN(Number(editForm.classification))
        ? Number(editForm.classification)
        : undefined;
    const number =
      editForm.number.trim() !== "" && !Number.isNaN(Number(editForm.number)) ? Number(editForm.number) : undefined;
    const numberError = getPlayerNumberError(number);
    if (numberError) {
      setPlayerActionError(numberError);
      return;
    }
    const playersPayload = (team.players ?? []).map((p) =>
      p.id === editingPlayer.id
        ? { firstName, lastName, classification, number }
        : {
            firstName: p.firstName,
            lastName: p.lastName,
            // Prisma returns null for optional DB fields; Zod .optional() accepts only undefined
            classification: p.classification ?? undefined,
            number: p.number ?? undefined,
          }
    );
    const success = await updateTeamPlayers(playersPayload);
    if (success) {
      handleEditPlayerClose();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!team || !deleteConfirmPlayer) return;
    const playersPayload = (team.players ?? [])
      .filter((p) => p.id !== deleteConfirmPlayer.id)
      .map((p) => ({
        firstName: p.firstName,
        lastName: p.lastName,
        classification: p.classification ?? undefined,
        number: p.number ?? undefined,
      }));
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
      number: 0,
    });
    setAddingNewPlayer(true);
  };

  const handleAddPlayerClose = () => {
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
    const classification = Number(newPlayerForm.classification) ? Number(newPlayerForm.classification) : undefined;
    const number = newPlayerForm.number ? Number(newPlayerForm.number) : undefined;
    const numberError = getPlayerNumberError(number);
    if (numberError) {
      setPlayerActionError(numberError);
      return;
    }
    const playersPayload = [
      ...(team.players ?? []).map((p) => ({
        firstName: p.firstName,
        lastName: p.lastName,
        classification: p.classification ?? undefined,
        number: p.number ?? undefined,
      })),
      { firstName, lastName, classification, number },
    ];
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
          <Typography variant="h3" sx={{ fontWeight: 900 }}>
            {team.name}
          </Typography>
          {team.websiteUrl ? (
            <Link
              href={
                team.websiteUrl.startsWith("http://") || team.websiteUrl.startsWith("https://")
                  ? team.websiteUrl
                  : `https://${team.websiteUrl}`
              }
              target="_blank"
              rel="noreferrer"
              underline="hover"
            >
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

      <Dialog open={editOpen} onClose={handleEditClose} maxWidth="md" fullWidth>
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
        playerActionLoading={playerActionLoading}
        newPlayerForm={newPlayerForm}
        setNewPlayerForm={setNewPlayerForm}
      />

      {/* Edit player dialog */}
      <Dialog open={!!editingPlayer} onClose={handleEditPlayerClose} maxWidth="xs" fullWidth>
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
                required
                fullWidth
                size="small"
              />
              <TextField
                label="Nazwisko"
                value={editForm.lastName}
                onChange={(e) => setEditForm((f) => (f ? { ...f, lastName: e.target.value } : f))}
                required
                fullWidth
                size="small"
              />
              <TextField
                label="Klasyfikacja"
                type="number"
                inputProps={{ step: 0.5, min: 0.5, max: 4.0, inputMode: "decimal" }}
                value={editForm.classification}
                onChange={(e) => setEditForm((f) => (f ? { ...f, classification: e.target.value } : f))}
                fullWidth
                size="small"
              />
              <TextField
                label="Numer"
                type="number"
                inputProps={{ min: 1, max: 99, inputMode: "numeric" }}
                value={editForm.number}
                onChange={(e) => setEditForm((f) => (f ? { ...f, number: e.target.value } : f))}
                fullWidth
                size="small"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditPlayerClose} disabled={playerActionLoading}>
            Anuluj
          </Button>
          <Button variant="contained" onClick={handleEditPlayerSave} disabled={playerActionLoading || !editForm}>
            {playerActionLoading ? <CircularProgress size={24} /> : "Zapisz"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete player dialog */}
      <ConfirmationDialog
        open={Boolean(deleteConfirmPlayer)}
        onClose={handleDeleteConfirmClose}
        onConfirm={handleDeleteConfirm}
        loading={playerActionLoading}
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
        loading={deleteTeamLoading}
        title="Usuń drużynę"
        description={
          <Typography>
            Operacja usunie drużynę <strong>{team.name}</strong> z bazy danych. Czy na pewno chcesz kontynuować?
          </Typography>
        }
        errorMessage={deleteTeamError}
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
                  <TableRow sx={{ bgcolor: "grey.100" }}>
                    <TableCell sx={{ fontWeight: "bold" }}>Imię i Nazwisko</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Klasyfikacja</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Numer</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {players.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 4, color: "text.secondary" }}>
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
