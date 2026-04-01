import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  Tooltip,
} from "@mui/material";
import { useId } from "react";
import { Trash2 } from "lucide-react";
import { muiSelectTextFieldAccessibilityProps } from "@/lib/muiSelectTextFieldAccessibility";
import type { Match, Tournament } from "@/types";
import {
  MATCH_DURATION_MINUTES,
  minutesToTime,
  timeToMinutes,
} from "@/features/tournaments/components/Tournaments/TournamentDetails/hooks/matchPlanHelpers";
import type {
  MatchPlanAddState,
  MatchPlanEditState,
} from "@/features/tournaments/components/Tournaments/TournamentDetails/hooks/useMatchPlanManager";

interface AddMatchDialogProps {
  addMatch: MatchPlanAddState;
  tournament: Tournament;
}

interface EditMatchDialogProps {
  editMatch: MatchPlanEditState;
  tournament: Tournament;
  matches: Match[];
  deleteMatchLoading: boolean;
  setMatchToDelete: (match: Match) => void;
  setDeleteMatchError: (value: string | null) => void;
}

const computeDraftEndTime = (startTime: string) => {
  const startMinutes = timeToMinutes(startTime) ?? 0;
  return minutesToTime(startMinutes + MATCH_DURATION_MINUTES);
};

export function AddMatchDialog({ addMatch, tournament }: AddMatchDialogProps) {
  const matchPlanSelectId = useId().replace(/:/g, "");

  return (
    <Dialog open={addMatch.open} onClose={addMatch.closeDialog} fullWidth maxWidth="md" disableRestoreFocus>
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
          Tworzenie planu rozgrywek
        </Typography>

        <TextField
          select
          label="Dzień tygodnia"
          {...muiSelectTextFieldAccessibilityProps(`${matchPlanSelectId}-weekday`)}
          value={String(addMatch.dayTimestamp ?? "")}
          onChange={(e) => addMatch.setDayTimestamp(Number(e.target.value))}
          size="small"
          sx={{ minWidth: 220 }}
        >
          {addMatch.options.map((o) => (
            <MenuItem key={o.timestamp} value={String(o.timestamp)}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
      </DialogTitle>

      <DialogContent dividers>
        {addMatch.error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {addMatch.error}
          </Alert>
        ) : null}

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 2 }}>
          <TextField
            select
            label="Drużyna A"
            {...muiSelectTextFieldAccessibilityProps(`${matchPlanSelectId}-team-a`)}
            value={addMatch.teamAId}
            onChange={(e) => addMatch.setTeamAId(String(e.target.value))}
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
            select
            label="Drużyna B"
            {...muiSelectTextFieldAccessibilityProps(`${matchPlanSelectId}-team-b`)}
            value={addMatch.teamBId}
            onChange={(e) => addMatch.setTeamBId(String(e.target.value))}
            fullWidth
            size="small"
          >
            {tournament.teams.map((t) => (
              <MenuItem key={t.id} value={t.id} disabled={t.id === addMatch.teamAId}>
                {t.name}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "120px 120px 105px 105px 105px" },
            gap: 1.5,
            mb: 2,
            alignItems: "end",
          }}
        >
          <TextField
            type="time"
            label="Start"
            value={addMatch.startTime}
            onChange={(e) => addMatch.setStartTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{ minWidth: 120 }}
          />

          <TextField
            type="time"
            label="Koniec"
            value={addMatch.endTime}
            InputLabelProps={{ shrink: true }}
            InputProps={{ readOnly: true }}
            size="small"
            sx={{ minWidth: 120 }}
          />

          <TextField
            select
            label="Boisko"
            {...muiSelectTextFieldAccessibilityProps(`${matchPlanSelectId}-court`)}
            value={addMatch.court}
            onChange={(e) => addMatch.setCourt(String(e.target.value))}
            size="small"
            sx={{ minWidth: 105 }}
          >
            <MenuItem value="1">1</MenuItem>
            <MenuItem value="2">2</MenuItem>
          </TextField>

          <TextField
            type="number"
            label="Wynik A"
            value={addMatch.scoreA}
            onChange={(e) => addMatch.setScoreA(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{ minWidth: 105 }}
          />

          <TextField
            type="number"
            label="Wynik B"
            value={addMatch.scoreB}
            onChange={(e) => addMatch.setScoreB(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{ minWidth: 105 }}
          />
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Typography sx={{ fontWeight: 900, mb: 1, fontSize: 14 }}>Kolory koszulek</Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
          <Box>
            <Typography color="text.secondary" sx={{ mb: 1, fontSize: 13 }}>
              Drużyna A
            </Typography>
            <RadioGroup
              row
              value={addMatch.jerseyA}
              onChange={(e) => {
                const next = e.target.value as "jasne" | "ciemne";
                addMatch.setJerseyA(next);
                addMatch.setJerseyB(next === "jasne" ? "ciemne" : "jasne");
              }}
            >
              <FormControlLabel
                value="jasne"
                control={<Radio size="small" />}
                label="Jasne"
                sx={{ "& .MuiFormControlLabel-label": { fontSize: 13 } }}
              />
              <FormControlLabel
                value="ciemne"
                control={<Radio size="small" />}
                label="Ciemne"
                sx={{ "& .MuiFormControlLabel-label": { fontSize: 13 } }}
              />
            </RadioGroup>
          </Box>

          <Box>
            <Typography color="text.secondary" sx={{ mb: 1, fontSize: 13 }}>
              Drużyna B
            </Typography>
            <RadioGroup
              row
              value={addMatch.jerseyB}
              onChange={(e) => {
                const next = e.target.value as "jasne" | "ciemne";
                addMatch.setJerseyB(next);
                addMatch.setJerseyA(next === "jasne" ? "ciemne" : "jasne");
              }}
            >
              <FormControlLabel
                value="jasne"
                control={<Radio size="small" />}
                label="Jasne"
                sx={{ "& .MuiFormControlLabel-label": { fontSize: 13 } }}
              />
              <FormControlLabel
                value="ciemne"
                control={<Radio size="small" />}
                label="Ciemne"
                sx={{ "& .MuiFormControlLabel-label": { fontSize: 13 } }}
              />
            </RadioGroup>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={addMatch.closeDialog} disabled={addMatch.loading}>
          Anuluj
        </Button>
        <Button variant="contained" onClick={addMatch.submit} disabled={addMatch.loading}>
          Dodaj
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function EditMatchDialog({
  editMatch,
  tournament,
  matches,
  deleteMatchLoading,
  setMatchToDelete,
  setDeleteMatchError,
}: EditMatchDialogProps) {
  const matchPlanSelectId = useId().replace(/:/g, "");

  return (
    <Dialog open={editMatch.open} onClose={editMatch.closeDialog} fullWidth maxWidth="md" disableRestoreFocus>
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
          Edycja meczu
        </Typography>

        <TextField
          select
          label="Dzień tygodnia"
          {...muiSelectTextFieldAccessibilityProps(`${matchPlanSelectId}-weekday`)}
          value={String(editMatch.dayTimestamp ?? "")}
          onChange={(e) => editMatch.setDayTimestamp(Number(e.target.value))}
          size="small"
          sx={{ minWidth: 220 }}
        >
          {editMatch.options.map((o) => (
            <MenuItem key={o.timestamp} value={String(o.timestamp)}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
      </DialogTitle>

      <DialogContent dividers>
        {editMatch.error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {editMatch.error}
          </Alert>
        ) : null}

        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table
            size="small"
            aria-label="Tabela meczów"
            sx={{
              tableLayout: "auto",
              "& .MuiTableCell-root": {
                px: 1,
              },
              "& .MuiTableCell-head": {
                px: 1,
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell align="center" />
                <TableCell align="center">Drużyna A</TableCell>
                <TableCell align="center">Wynik A</TableCell>
                <TableCell align="center">Start</TableCell>
                <TableCell align="center">Koniec</TableCell>
                <TableCell align="center">Wynik B</TableCell>
                <TableCell align="center">Drużyna B</TableCell>
                <TableCell align="center">Boisko</TableCell>
                <TableCell align="center">Kolor koszulek</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {editMatch.drafts.map((draft, idx) => (
                <TableRow key={draft.id ?? `row-${idx}`}>
                  <TableCell align="center" sx={{ paddingLeft: 1, paddingRight: 1, verticalAlign: "middle" }}>
                    {(() => {
                      const teamAName = tournament.teams.find((t) => t.id === draft.teamAId)?.name ?? draft.teamAId;
                      const teamBName = tournament.teams.find((t) => t.id === draft.teamBId)?.name ?? draft.teamBId;

                      const canDeleteFromApi = Boolean(draft.id);
                      const disabled = editMatch.loading || (canDeleteFromApi && deleteMatchLoading);

                      return (
                        <Tooltip title="Usuń rozgrywkę">
                          <Box
                            component="span"
                            sx={{ display: "inline-flex", justifyContent: "center", width: "100%" }}
                          >
                            <IconButton
                              aria-label={`Usuń rozgrywkę ${teamAName} vs ${teamBName}`}
                              color="error"
                              onClick={() => {
                                if (disabled) return;

                                if (!draft.id) {
                                  editMatch.setDrafts((prev) => prev.filter((_, i) => i !== idx));
                                  return;
                                }

                                const match = matches.find((m) => m.id === draft.id);
                                if (!match) {
                                  editMatch.setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
                                  return;
                                }

                                setDeleteMatchError(null);
                                setMatchToDelete(match);
                                editMatch.closeDialog();
                              }}
                              size="small"
                              disabled={disabled}
                              sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 0 }}
                            >
                              <Trash2 size={18} />
                            </IconButton>
                          </Box>
                        </Tooltip>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <TextField
                      select
                      label="Drużyna A"
                      {...muiSelectTextFieldAccessibilityProps(`${matchPlanSelectId}-team-a-${idx}`)}
                      value={draft.teamAId}
                      onChange={(e) => {
                        const nextTeamAId = String(e.target.value);
                        editMatch.setDrafts((prev) =>
                          prev.map((d, i) => {
                            if (i !== idx) return d;
                            const nextTeamBId =
                              d.teamBId === nextTeamAId
                                ? (tournament.teams.find((t) => t.id !== nextTeamAId)?.id ?? "")
                                : d.teamBId;
                            return { ...d, teamAId: nextTeamAId, teamBId: nextTeamBId };
                          })
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

                  <TableCell>
                    <TextField
                      type="number"
                      label="Wynik A"
                      value={draft.scoreA}
                      onChange={(e) =>
                        editMatch.setDrafts((prev) =>
                          prev.map((d, i) => (i === idx ? { ...d, scoreA: e.target.value } : d))
                        )
                      }
                      InputLabelProps={{ shrink: true }}
                      size="small"
                      fullWidth
                      sx={{ minWidth: 90 }}
                    />
                  </TableCell>

                  <TableCell>
                    <TextField
                      type="time"
                      label="Start"
                      value={draft.startTime}
                      onChange={(e) => {
                        const nextStart = e.target.value;
                        const nextEnd = computeDraftEndTime(nextStart);
                        editMatch.setDrafts((prev) =>
                          prev.map((d, i) => (i === idx ? { ...d, startTime: nextStart, endTime: nextEnd } : d))
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
                      InputLabelProps={{ shrink: true }}
                      InputProps={{ readOnly: true }}
                      size="small"
                    />
                  </TableCell>

                  <TableCell>
                    <TextField
                      type="number"
                      label="Wynik B"
                      value={draft.scoreB}
                      onChange={(e) =>
                        editMatch.setDrafts((prev) =>
                          prev.map((d, i) => (i === idx ? { ...d, scoreB: e.target.value } : d))
                        )
                      }
                      InputLabelProps={{ shrink: true }}
                      size="small"
                      fullWidth
                      sx={{ minWidth: 90 }}
                    />
                  </TableCell>

                  <TableCell>
                    <TextField
                      select
                      label="Drużyna B"
                      {...muiSelectTextFieldAccessibilityProps(`${matchPlanSelectId}-team-b-${idx}`)}
                      value={draft.teamBId}
                      onChange={(e) =>
                        editMatch.setDrafts((prev) =>
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

                  <TableCell>
                    <TextField
                      select
                      label="Boisko"
                      {...muiSelectTextFieldAccessibilityProps(`${matchPlanSelectId}-court-${idx}`)}
                      value={draft.court}
                      onChange={(e) =>
                        editMatch.setDrafts((prev) =>
                          prev.map((d, i) => (i === idx ? { ...d, court: String(e.target.value) } : d))
                        )
                      }
                      size="small"
                      fullWidth
                      sx={{ minWidth: 90 }}
                    >
                      <MenuItem value="1">1</MenuItem>
                      <MenuItem value="2">2</MenuItem>
                    </TextField>
                  </TableCell>

                  <TableCell sx={{ verticalAlign: "middle", px: 1.5 }}>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr",
                        gap: 0.25,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "nowrap" }}>
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 12, lineHeight: 1 }}>
                          A
                        </Typography>
                        <RadioGroup
                          row
                          value={draft.jerseyA}
                          sx={{ flexWrap: "nowrap", whiteSpace: "nowrap", my: -0.25 }}
                          onChange={(e) => {
                            const next = e.target.value as "jasne" | "ciemne";
                            editMatch.setDrafts((prev) =>
                              prev.map((d, i) =>
                                i === idx ? { ...d, jerseyA: next, jerseyB: next === "jasne" ? "ciemne" : "jasne" } : d
                              )
                            );
                          }}
                        >
                          <FormControlLabel
                            value="jasne"
                            control={<Radio size="small" />}
                            label="Jasne"
                            sx={{
                              mr: 0.75,
                              my: 0,
                              "& .MuiFormControlLabel-label": { fontSize: 12, whiteSpace: "nowrap", lineHeight: 1 },
                            }}
                          />
                          <FormControlLabel
                            value="ciemne"
                            control={<Radio size="small" />}
                            label="Ciemne"
                            sx={{
                              mr: 0,
                              my: 0,
                              "& .MuiFormControlLabel-label": { fontSize: 12, whiteSpace: "nowrap", lineHeight: 1 },
                            }}
                          />
                        </RadioGroup>
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "nowrap" }}>
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 12, lineHeight: 1 }}>
                          B
                        </Typography>
                        <RadioGroup
                          row
                          value={draft.jerseyB}
                          sx={{ flexWrap: "nowrap", whiteSpace: "nowrap", my: -0.25 }}
                          onChange={(e) => {
                            const next = e.target.value as "jasne" | "ciemne";
                            editMatch.setDrafts((prev) =>
                              prev.map((d, i) =>
                                i === idx ? { ...d, jerseyB: next, jerseyA: next === "jasne" ? "ciemne" : "jasne" } : d
                              )
                            );
                          }}
                        >
                          <FormControlLabel
                            value="jasne"
                            control={<Radio size="small" />}
                            label="Jasne"
                            sx={{
                              mr: 0.75,
                              my: 0,
                              "& .MuiFormControlLabel-label": { fontSize: 12, whiteSpace: "nowrap", lineHeight: 1 },
                            }}
                          />
                          <FormControlLabel
                            value="ciemne"
                            control={<Radio size="small" />}
                            label="Ciemne"
                            sx={{
                              mr: 0,
                              my: 0,
                              "& .MuiFormControlLabel-label": { fontSize: 12, whiteSpace: "nowrap", lineHeight: 1 },
                            }}
                          />
                        </RadioGroup>
                      </Box>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-start" }}>
          <Button variant="outlined" onClick={editMatch.addRow} disabled={editMatch.loading}>
            Dodaj kolejny mecz
          </Button>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={editMatch.closeDialog} disabled={editMatch.loading}>
          Anuluj
        </Button>
        <Button
          color="error"
          variant="outlined"
          disabled={editMatch.loading || deleteMatchLoading}
          onClick={() => {
            if (!editMatch.match) return;
            setDeleteMatchError(null);
            setMatchToDelete(editMatch.match);
            editMatch.closeDialog();
          }}
        >
          Usuń
        </Button>
        <Button variant="contained" onClick={editMatch.submit} disabled={editMatch.loading}>
          Zapisz
        </Button>
      </DialogActions>
    </Dialog>
  );
}
