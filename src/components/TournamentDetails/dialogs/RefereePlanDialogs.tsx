import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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
import type { Match, Person, Tournament } from "@/types";
import { MATCH_DURATION_MINUTES, minutesToTime, timeToMinutes } from "@/components/TournamentDetails/hooks/matchPlanHelpers";
import type {
  RefereePlanAddState,
  RefereePlanEditState,
} from "@/components/TournamentDetails/hooks/useRefereePlanManager";

interface AddRefereePlanDialogProps {
  addRefereePlan: RefereePlanAddState;
  tournament: Tournament;
  personDisplayName: (person: Person) => string;
}

interface EditRefereePlanDialogProps {
  editRefereePlan: RefereePlanEditState;
  tournament: Tournament;
  matches: Match[];
  deleteMatchLoading: boolean;
  setMatchToDelete: (match: Match) => void;
  setDeleteMatchError: (value: string | null) => void;
  personDisplayName: (person: Person) => string;
}

const isRefereeTaken = (candidateId: string, excludeId: string, conflictingIds: string[]) =>
  candidateId !== excludeId && conflictingIds.includes(candidateId);

const computeRefereeDialogEndTimeFromStart = (startTime: string) => {
  const startMinutes = timeToMinutes(startTime) ?? 0;
  return minutesToTime(startMinutes + MATCH_DURATION_MINUTES);
};

export function AddRefereePlanDialog({ addRefereePlan, tournament, personDisplayName }: AddRefereePlanDialogProps) {
  const addRefereePlanPenaltyConflicts = [
    addRefereePlan.referee1Id,
    addRefereePlan.referee2Id,
    addRefereePlan.tableClockId,
  ];
  const addRefereePlanClockConflicts = [
    addRefereePlan.referee1Id,
    addRefereePlan.referee2Id,
    addRefereePlan.tablePenaltyId,
  ];

  return (
    <Dialog open={addRefereePlan.open} onClose={addRefereePlan.closeDialog} fullWidth maxWidth="md">
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Typography component="div" variant="h6" sx={{ fontWeight: 900 }}>
          Tworzenie planu sędziów
        </Typography>

        <TextField
          select
          label="Dzień tygodnia"
          value={String(addRefereePlan.dayTimestamp ?? "")}
          onChange={(e) => addRefereePlan.setDayTimestamp(Number(e.target.value))}
          size="small"
          sx={{ minWidth: 220 }}
        >
          {addRefereePlan.dayOptions.map((o) => (
            <MenuItem key={o.timestamp} value={String(o.timestamp)}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
      </DialogTitle>

      <DialogContent dividers>
        {addRefereePlan.error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {addRefereePlan.error}
          </Alert>
        ) : null}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 120px 120px 1fr 95px" },
              gap: 1.5,
              alignItems: "end",
            }}
          >
            <TextField
              select
              label="Drużyna A"
              value={addRefereePlan.teamAId}
              onChange={(e) => addRefereePlan.setTeamAId(String(e.target.value))}
              fullWidth
              size="small"
            >
              {tournament.teams.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              type="time"
              label="Start"
              value={addRefereePlan.startTime}
              onChange={(e) => addRefereePlan.setStartTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />

            <TextField
              type="time"
              label="Koniec"
              value={addRefereePlan.endTime}
              InputLabelProps={{ shrink: true }}
              InputProps={{ readOnly: true }}
              size="small"
            />

            <TextField
              select
              label="Drużyna B"
              value={addRefereePlan.teamBId}
              onChange={(e) => addRefereePlan.setTeamBId(String(e.target.value))}
              fullWidth
              size="small"
            >
              {tournament.teams.map((t) => (
                <MenuItem key={t.id} value={t.id} disabled={t.id === addRefereePlan.teamAId}>
                  {t.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Boisko"
              value={addRefereePlan.court}
              onChange={(e) => addRefereePlan.setCourt(String(e.target.value))}
              size="small"
            >
              <MenuItem value="1">1</MenuItem>
              <MenuItem value="2">2</MenuItem>
            </TextField>
          </Box>

          <Divider />

          <Typography sx={{ fontWeight: 900, fontSize: 14 }}>Obsada sędziowska</Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr 1fr" },
              gap: 1.5,
            }}
          >
            <TextField
              select
              label="Sędzia 1"
              value={addRefereePlan.referee1Id}
              onChange={(e) => addRefereePlan.setReferee1Id(String(e.target.value))}
              size="small"
            >
              <MenuItem value="">—</MenuItem>
              {tournament.referees.map((r) => (
                <MenuItem
                  key={r.id}
                  value={r.id}
                  disabled={
                    r.id !== addRefereePlan.referee1Id &&
                    [addRefereePlan.referee2Id, addRefereePlan.tablePenaltyId, addRefereePlan.tableClockId].includes(
                      r.id
                    )
                  }
                >
                  {personDisplayName(r)}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Sędzia 2"
              value={addRefereePlan.referee2Id}
              onChange={(e) => addRefereePlan.setReferee2Id(String(e.target.value))}
              size="small"
            >
              <MenuItem value="">—</MenuItem>
              {tournament.referees.map((r) => (
                <MenuItem
                  key={r.id}
                  value={r.id}
                  disabled={
                    r.id !== addRefereePlan.referee2Id &&
                    [addRefereePlan.referee1Id, addRefereePlan.tablePenaltyId, addRefereePlan.tableClockId].includes(
                      r.id
                    )
                  }
                >
                  {personDisplayName(r)}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Stolik kar"
              value={addRefereePlan.tablePenaltyId}
              onChange={(e) => addRefereePlan.setTablePenaltyId(String(e.target.value))}
              size="small"
            >
              <MenuItem value="">—</MenuItem>
              {tournament.referees.map((r) => {
                const penaltyDisabled = isRefereeTaken(
                  r.id,
                  addRefereePlan.tablePenaltyId,
                  addRefereePlanPenaltyConflicts
                );
                return (
                  <MenuItem key={r.id} value={r.id} disabled={penaltyDisabled}>
                    {personDisplayName(r)}
                  </MenuItem>
                );
              })}
            </TextField>

            <TextField
              select
              label="Zagary"
              value={addRefereePlan.tableClockId}
              onChange={(e) => addRefereePlan.setTableClockId(String(e.target.value))}
              size="small"
            >
              <MenuItem value="">—</MenuItem>
              {tournament.referees.map((r) => {
                const clockDisabled = isRefereeTaken(r.id, addRefereePlan.tableClockId, addRefereePlanClockConflicts);
                return (
                  <MenuItem key={r.id} value={r.id} disabled={clockDisabled}>
                    {personDisplayName(r)}
                  </MenuItem>
                );
              })}
            </TextField>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={addRefereePlan.closeDialog} disabled={addRefereePlan.loading}>
          Anuluj
        </Button>
        <Button variant="contained" onClick={addRefereePlan.submit} disabled={addRefereePlan.loading}>
          Dodaj
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function EditRefereePlanDialog({
  editRefereePlan,
  tournament,
  matches,
  deleteMatchLoading,
  setMatchToDelete,
  setDeleteMatchError,
  personDisplayName,
}: EditRefereePlanDialogProps) {
  return (
    <Dialog open={editRefereePlan.open} onClose={editRefereePlan.closeDialog} fullWidth maxWidth="md">
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Typography component="div" variant="h6" sx={{ fontWeight: 900 }}>
          Edycja planu sędziów
        </Typography>

        <TextField
          select
          label="Dzień tygodnia"
          value={String(editRefereePlan.dayTimestamp ?? "")}
          onChange={(e) => editRefereePlan.setDayTimestamp(Number(e.target.value))}
          size="small"
          sx={{ minWidth: 220 }}
        >
          {editRefereePlan.dayOptions.map((o) => (
            <MenuItem key={o.timestamp} value={String(o.timestamp)}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
      </DialogTitle>

      <DialogContent dividers>
        {editRefereePlan.error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {editRefereePlan.error}
          </Alert>
        ) : null}

        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small" aria-label="Tabela planu sędziów (edycja)">
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ width: 48 }} />
                <TableCell align="center">Drużyna A</TableCell>
                <TableCell align="center">Start</TableCell>
                <TableCell align="center">Koniec</TableCell>
                <TableCell align="center">Drużyna B</TableCell>
                <TableCell align="center">Boisko</TableCell>
                <TableCell align="center">Sędzia 1</TableCell>
                <TableCell align="center">Sędzia 2</TableCell>
                <TableCell align="center">Stolik kar</TableCell>
                <TableCell align="center">Zagary</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {editRefereePlan.drafts.map((draft, idx) => {
                const teamAName = tournament.teams.find((t) => t.id === draft.teamAId)?.name ?? draft.teamAId;
                const teamBName = tournament.teams.find((t) => t.id === draft.teamBId)?.name ?? draft.teamBId;

                return (
                  <TableRow key={draft.id ?? `ref-row-${idx}`}>
                    <TableCell
                      align="center"
                      sx={{ width: 48, paddingLeft: 1, paddingRight: 1, verticalAlign: "middle" }}
                    >
                      <Tooltip title="Usuń pozycję">
                        <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
                          <IconButton
                            aria-label={`Usuń pozycję ${teamAName} vs ${teamBName}`}
                            color="error"
                            onClick={() => {
                              if (editRefereePlan.loading) return;

                              if (!draft.id) {
                                editRefereePlan.setDrafts((prev) => prev.filter((_, i) => i !== idx));
                                return;
                              }

                              const match = matches.find((m) => m.id === draft.id);
                              if (!match) {
                                console.warn(`Match with id ${draft.id} not found in matches array`);
                                editRefereePlan.setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
                                return;
                              }

                              setDeleteMatchError(null);
                              setMatchToDelete(match);
                              editRefereePlan.closeDialog();
                            }}
                            size="small"
                            disabled={editRefereePlan.loading || (draft.id ? deleteMatchLoading : false)}
                            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 0 }}
                          >
                            <Trash2 size={18} />
                          </IconButton>
                        </Box>
                      </Tooltip>
                    </TableCell>

                    <TableCell sx={{ minWidth: 180 }}>
                      <TextField
                        select
                        label="Drużyna A"
                        value={draft.teamAId}
                        onChange={(e) => {
                          const nextTeamAId = String(e.target.value);
                          editRefereePlan.setDrafts((prev) =>
                            prev.map((d, i) =>
                              i !== idx
                                ? d
                                : {
                                    ...d,
                                    teamAId: nextTeamAId,
                                    teamBId:
                                      d.teamBId === nextTeamAId
                                        ? (tournament.teams.find((t) => t.id !== nextTeamAId)?.id ?? "")
                                        : d.teamBId,
                                  }
                            )
                          );
                        }}
                        size="small"
                        fullWidth
                      >
                        {tournament.teams.map((t) => (
                          <MenuItem key={t.id} value={t.id}>
                            {t.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>

                    <TableCell sx={{ minWidth: 120 }}>
                      <TextField
                        type="time"
                        label="Start"
                        value={draft.startTime}
                        onChange={(e) => {
                          const nextStart = e.target.value;
                          const nextEnd = computeRefereeDialogEndTimeFromStart(nextStart);
                          editRefereePlan.setDrafts((prev) =>
                            prev.map((d, i) => (i === idx ? { ...d, startTime: nextStart, endTime: nextEnd } : d))
                          );
                        }}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                      />
                    </TableCell>

                    <TableCell sx={{ minWidth: 120 }}>
                      <TextField
                        type="time"
                        label="Koniec"
                        value={draft.endTime}
                        InputLabelProps={{ shrink: true }}
                        InputProps={{ readOnly: true }}
                        size="small"
                      />
                    </TableCell>

                    <TableCell sx={{ minWidth: 180 }}>
                      <TextField
                        select
                        label="Drużyna B"
                        value={draft.teamBId}
                        onChange={(e) =>
                          editRefereePlan.setDrafts((prev) =>
                            prev.map((d, i) => (i === idx ? { ...d, teamBId: String(e.target.value) } : d))
                          )
                        }
                        size="small"
                        fullWidth
                      >
                        {tournament.teams.map((t) => (
                          <MenuItem key={t.id} value={t.id} disabled={t.id === draft.teamAId}>
                            {t.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>

                    <TableCell sx={{ minWidth: 95 }}>
                      <TextField
                        select
                        label="Boisko"
                        value={draft.court}
                        onChange={(e) =>
                          editRefereePlan.setDrafts((prev) =>
                            prev.map((d, i) => (i === idx ? { ...d, court: String(e.target.value) } : d))
                          )
                        }
                        size="small"
                      >
                        <MenuItem value="1">1</MenuItem>
                        <MenuItem value="2">2</MenuItem>
                      </TextField>
                    </TableCell>

                    <TableCell sx={{ minWidth: 160 }}>
                      <TextField
                        select
                        label="Sędzia 1"
                        value={draft.referee1Id}
                        onChange={(e) =>
                          editRefereePlan.setDrafts((prev) =>
                            prev.map((d, i) => (i === idx ? { ...d, referee1Id: String(e.target.value) } : d))
                          )
                        }
                        size="small"
                        fullWidth
                      >
                        <MenuItem value="">—</MenuItem>
                        {tournament.referees.map((r) => (
                          <MenuItem
                            key={r.id}
                            value={r.id}
                            disabled={
                              r.id !== draft.referee1Id &&
                              [draft.referee2Id, draft.tablePenaltyId, draft.tableClockId].includes(r.id)
                            }
                          >
                            {personDisplayName(r)}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>

                    <TableCell sx={{ minWidth: 160 }}>
                      <TextField
                        select
                        label="Sędzia 2"
                        value={draft.referee2Id}
                        onChange={(e) =>
                          editRefereePlan.setDrafts((prev) =>
                            prev.map((d, i) => (i === idx ? { ...d, referee2Id: String(e.target.value) } : d))
                          )
                        }
                        size="small"
                        fullWidth
                      >
                        <MenuItem value="">—</MenuItem>
                        {tournament.referees.map((r) => (
                          <MenuItem
                            key={r.id}
                            value={r.id}
                            disabled={
                              r.id !== draft.referee2Id &&
                              [draft.referee1Id, draft.tablePenaltyId, draft.tableClockId].includes(r.id)
                            }
                          >
                            {personDisplayName(r)}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>

                    <TableCell sx={{ minWidth: 160 }}>
                      <TextField
                        select
                        label="Stolik kar"
                        value={draft.tablePenaltyId}
                        onChange={(e) =>
                          editRefereePlan.setDrafts((prev) =>
                            prev.map((d, i) => (i === idx ? { ...d, tablePenaltyId: String(e.target.value) } : d))
                          )
                        }
                        size="small"
                        fullWidth
                      >
                        <MenuItem value="">—</MenuItem>
                        {tournament.referees.map((r) => (
                          <MenuItem
                            key={r.id}
                            value={r.id}
                            disabled={
                              r.id !== draft.tablePenaltyId &&
                              [draft.referee1Id, draft.referee2Id, draft.tableClockId].includes(r.id)
                            }
                          >
                            {personDisplayName(r)}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>

                    <TableCell sx={{ minWidth: 160 }}>
                      <TextField
                        select
                        label="Zagary"
                        value={draft.tableClockId}
                        onChange={(e) =>
                          editRefereePlan.setDrafts((prev) =>
                            prev.map((d, i) => (i === idx ? { ...d, tableClockId: String(e.target.value) } : d))
                          )
                        }
                        size="small"
                        fullWidth
                      >
                        <MenuItem value="">—</MenuItem>
                        {tournament.referees.map((r) => (
                          <MenuItem
                            key={r.id}
                            value={r.id}
                            disabled={
                              r.id !== draft.tableClockId &&
                              [draft.referee1Id, draft.referee2Id, draft.tablePenaltyId].includes(r.id)
                            }
                          >
                            {personDisplayName(r)}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-start" }}>
          <Button variant="outlined" onClick={editRefereePlan.addRow} disabled={editRefereePlan.loading}>
            Dodaj kolejny wpis sędziów
          </Button>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={editRefereePlan.closeDialog} disabled={editRefereePlan.loading}>
          Anuluj
        </Button>
        <Button variant="contained" onClick={editRefereePlan.submit} disabled={editRefereePlan.loading}>
          Zapisz
        </Button>
      </DialogActions>
    </Dialog>
  );
}
