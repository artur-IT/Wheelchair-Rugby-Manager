import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Tooltip,
} from "@mui/material";
import { Trash2 } from "lucide-react";
import type { Tournament } from "@/types";
import type {
  ClassifierPlanAddState,
  ClassifierPlanEditState,
} from "@/features/tournaments/components/Tournaments/TournamentDetails/hooks/useClassifierPlanManager";

interface AddClassifierPlanDialogProps {
  addClassifierPlan: ClassifierPlanAddState;
  tournament: Tournament;
}

interface EditClassifierPlanDialogProps {
  editClassifierPlan: ClassifierPlanEditState;
  tournament: Tournament;
}

function getPlayers(tournament: Tournament) {
  return tournament.teams.flatMap((team) => team.players ?? []);
}

export function AddClassifierPlanDialog({ addClassifierPlan, tournament }: AddClassifierPlanDialogProps) {
  const players = getPlayers(tournament);
  const q = addClassifierPlan.search.trim().toLowerCase();
  const filteredPlayers = q ? players.filter((p) => `${p.firstName} ${p.lastName}`.toLowerCase().includes(q)) : players;

  return (
    <Dialog open={addClassifierPlan.open} onClose={addClassifierPlan.closeDialog} fullWidth maxWidth="md">
      <DialogTitle
        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}
      >
        <Typography component="div" variant="h6" sx={{ fontWeight: 900 }}>
          Tworzenie planu klasyfikatorów
        </Typography>
        <TextField
          select
          label="Dzień tygodnia"
          value={String(addClassifierPlan.dayTimestamp ?? "")}
          onChange={(e) => addClassifierPlan.setDayTimestamp(Number(e.target.value))}
          size="small"
          sx={{ minWidth: 220 }}
        >
          {addClassifierPlan.dayOptions.map((o) => (
            <MenuItem key={o.timestamp} value={String(o.timestamp)}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
      </DialogTitle>

      <DialogContent dividers>
        {addClassifierPlan.error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {addClassifierPlan.error}
          </Alert>
        ) : null}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 150px 150px 160px 160px" },
            gap: 1.5,
            alignItems: "end",
            mb: 2,
          }}
        >
          <TextField
            label="Wybrany zawodnik"
            value={
              players.find((p) => p.id === addClassifierPlan.playerId)
                ? `${players.find((p) => p.id === addClassifierPlan.playerId)?.firstName} ${players.find((p) => p.id === addClassifierPlan.playerId)?.lastName}`
                : ""
            }
            InputProps={{ readOnly: true }}
            size="small"
          />
          <TextField
            type="time"
            label="Start"
            value={addClassifierPlan.startTime}
            onChange={(e) => addClassifierPlan.setStartTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <TextField
            type="time"
            label="Koniec"
            value={addClassifierPlan.endTime}
            onChange={(e) => addClassifierPlan.setEndTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <TextField
            type="number"
            label="Klasyfikacja"
            value={addClassifierPlan.classification}
            onChange={(e) => addClassifierPlan.setClassification(e.target.value)}
            size="small"
            inputProps={{ step: "0.5", min: "0", max: "4" }}
          />
          <TextField
            select
            label="Obserwacja"
            value={addClassifierPlan.observation ? "yes" : "no"}
            onChange={(e) => addClassifierPlan.setObservation(String(e.target.value) === "yes")}
            size="small"
          >
            <MenuItem value="yes">Tak</MenuItem>
            <MenuItem value="no">Nie</MenuItem>
          </TextField>
        </Box>

        <TextField
          label="Szukaj zawodnika (imię lub nazwisko)"
          value={addClassifierPlan.search}
          onChange={(e) => addClassifierPlan.setSearch(e.target.value)}
          fullWidth
          size="small"
          sx={{ mb: 2 }}
        />

        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small" aria-label="Lista zawodników">
            <TableHead>
              <TableRow>
                <TableCell>Zawodnik</TableCell>
                <TableCell align="center">
                  Akcja
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPlayers.map((player) => (
                <TableRow key={player.id} selected={player.id === addClassifierPlan.playerId}>
                  <TableCell>
                    {player.firstName} {player.lastName}
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      variant={player.id === addClassifierPlan.playerId ? "contained" : "outlined"}
                      onClick={() => addClassifierPlan.setPlayerId(player.id)}
                      size="small"
                    >
                      Wybierz
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions>
        <Button onClick={addClassifierPlan.closeDialog} disabled={addClassifierPlan.loading}>
          Anuluj
        </Button>
        <Button variant="contained" onClick={addClassifierPlan.submit} disabled={addClassifierPlan.loading}>
          Dodaj
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function EditClassifierPlanDialog({ editClassifierPlan, tournament }: EditClassifierPlanDialogProps) {
  const players = getPlayers(tournament);

  return (
    <Dialog open={editClassifierPlan.open} onClose={editClassifierPlan.closeDialog} fullWidth maxWidth="md">
      <DialogTitle
        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}
      >
        <Typography component="div" variant="h6" sx={{ fontWeight: 900 }}>
          Edycja planu klasyfikatorów
        </Typography>
        <TextField
          select
          label="Dzień tygodnia"
          value={String(editClassifierPlan.dayTimestamp ?? "")}
          onChange={(e) => editClassifierPlan.setDayTimestamp(Number(e.target.value))}
          size="small"
          sx={{ minWidth: 220 }}
        >
          {editClassifierPlan.dayOptions.map((o) => (
            <MenuItem key={o.timestamp} value={String(o.timestamp)}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
      </DialogTitle>

      <DialogContent dividers>
        {editClassifierPlan.error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {editClassifierPlan.error}
          </Alert>
        ) : null}
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small" aria-label="Tabela planu klasyfikatorów (edycja)" sx={{ tableLayout: "auto" }}>
            <TableHead>
              <TableRow>
                <TableCell align="center" />
                <TableCell align="center">Zawodnik</TableCell>
                <TableCell align="center">Start</TableCell>
                <TableCell align="center">Koniec</TableCell>
                <TableCell align="center">Klasyfikacja</TableCell>
                <TableCell align="center">Obserwacja</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {editClassifierPlan.drafts.map((draft, idx) => (
                <TableRow key={draft.id ?? `class-row-${idx}`}>
                  <TableCell align="center">
                    <Tooltip title="Usuń pozycję">
                      <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
                        <IconButton
                          aria-label="Usuń pozycję"
                          color="error"
                          onClick={() => {
                            if (!draft.id) {
                              editClassifierPlan.setDrafts((prev) => prev.filter((_, i) => i !== idx));
                              return;
                            }
                            void editClassifierPlan.deleteEntry(draft.id);
                          }}
                          size="small"
                          sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 0 }}
                        >
                          <Trash2 size={18} />
                        </IconButton>
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <TextField
                      select
                      label="Zawodnik"
                      value={draft.playerId}
                      onChange={(e) =>
                        editClassifierPlan.setDrafts((prev) =>
                          prev.map((d, i) => (i === idx ? { ...d, playerId: String(e.target.value) } : d))
                        )
                      }
                      size="small"
                      fullWidth
                    >
                      {players.map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.firstName} {p.lastName}
                        </MenuItem>
                      ))}
                    </TextField>
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="time"
                      label="Start"
                      value={draft.startTime}
                      onChange={(e) => {
                        const startTime = e.target.value;
                        const [hRaw, mRaw] = startTime.split(":");
                        const h = Number(hRaw);
                        const m = Number(mRaw);
                        const end =
                          Number.isFinite(h) && Number.isFinite(m)
                            ? `${String((h + Math.floor((m + 30) / 60)) % 24).padStart(2, "0")}:${String((m + 30) % 60).padStart(2, "0")}`
                            : draft.endTime;
                        editClassifierPlan.setDrafts((prev) =>
                          prev.map((d, i) => (i === idx ? { ...d, startTime, endTime: end } : d))
                        );
                      }}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="time"
                      label="Koniec"
                      value={draft.endTime}
                      onChange={(e) =>
                        editClassifierPlan.setDrafts((prev) =>
                          prev.map((d, i) => (i === idx ? { ...d, endTime: e.target.value } : d))
                        )
                      }
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      label="Klasyfikacja"
                      value={draft.classification}
                      onChange={(e) =>
                        editClassifierPlan.setDrafts((prev) =>
                          prev.map((d, i) => (i === idx ? { ...d, classification: e.target.value } : d))
                        )
                      }
                      size="small"
                      inputProps={{ step: "0.5", min: "0", max: "4" }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      select
                      label="Obserwacja"
                      value={draft.observation ? "yes" : "no"}
                      onChange={(e) => {
                        const observation = String(e.target.value) === "yes";
                        editClassifierPlan.setDrafts((prev) =>
                          prev.map((d, i) => (i === idx ? { ...d, observation } : d))
                        );
                      }}
                      size="small"
                      fullWidth
                    >
                      <MenuItem value="yes">Tak</MenuItem>
                      <MenuItem value="no">Nie</MenuItem>
                    </TextField>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-start" }}>
          <Button variant="outlined" onClick={editClassifierPlan.addRow} disabled={editClassifierPlan.loading}>
            Dodaj kolejne badanie
          </Button>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={editClassifierPlan.closeDialog} disabled={editClassifierPlan.loading}>
          Anuluj
        </Button>
        <Button variant="contained" onClick={editClassifierPlan.submit} disabled={editClassifierPlan.loading}>
          Zapisz
        </Button>
      </DialogActions>
    </Dialog>
  );
}
