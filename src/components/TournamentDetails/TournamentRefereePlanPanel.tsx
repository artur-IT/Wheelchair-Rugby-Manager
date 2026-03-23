import { Box, Button, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import DataLoadAlert from "@/components/ui/DataLoadAlert";
import type { Match, Person, RefereeRole, Tournament } from "@/types";
import { MATCH_DURATION_MS } from "@/components/TournamentDetails/hooks/matchPlanHelpers";

const outOfRangeTimeCellSx = {
  bgcolor: "error.main",
  color: "common.white",
  fontWeight: 700,
} as const;

interface TournamentRefereePlanPanelProps {
  tournament: Tournament;
  matches: Match[];
  refereePlanByMatchId: Record<string, Partial<Record<RefereeRole, string>>>;
  refereePlanLoading: boolean;
  refereePlanError: string | null;
  onRetryRefereePlan?: () => void;
  scheduleTableDayTimestamps: number[];
  getMatchDayTimestamp: (scheduledAtIso: string) => number;
  getScheduleDayLabel: (timestamp: number) => string;
  openAddRefereePlanDialog: (presetDayTimestamp?: number | null, allowedDays?: number[] | null) => void;
  openNewDayRefereePlanTable: () => void;
  openEditRefereePlanDialog: (matchesToEdit: Match[]) => void;
  personDisplayName: (p: Person) => string;
  setMatchDayToDelete: (timestamp: number) => void;
  deleteMatchDayLoading: boolean;
  matchDayToDelete: number | null;
  isMatchOutOfRange?: (scheduledAtIso: string) => boolean;
  isDayOutOfRange?: (dayTimestamp: number) => boolean;
}

export default function TournamentRefereePlanPanel({
  tournament,
  matches,
  refereePlanByMatchId,
  refereePlanLoading,
  refereePlanError,
  onRetryRefereePlan,
  scheduleTableDayTimestamps,
  getMatchDayTimestamp,
  getScheduleDayLabel,
  openAddRefereePlanDialog,
  openNewDayRefereePlanTable,
  openEditRefereePlanDialog,
  personDisplayName,
  setMatchDayToDelete,
  deleteMatchDayLoading,
  matchDayToDelete,
  isMatchOutOfRange,
  isDayOutOfRange,
}: TournamentRefereePlanPanelProps) {
  return (
    <Paper
      sx={{
        p: 4,
        borderRadius: 3,
        bgcolor: "#fff7ed",
        border: "1px solid",
        borderColor: "grey.200",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Box
          sx={{
            bgcolor: "#fde68a",
            p: 1,
            borderRadius: 2,
            color: "#b45309",
          }}
        >
          <Typography component="div" sx={{ fontWeight: 900 }}>
            SJ
          </Typography>
        </Box>
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          Plan Sędziów
        </Typography>
      </Box>

      {refereePlanLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
          <CircularProgress size={24} />
        </Box>
      ) : refereePlanError ? (
        <DataLoadAlert message={refereePlanError} onRetry={onRetryRefereePlan} />
      ) : scheduleTableDayTimestamps.length === 0 ? (
        <Box
          sx={{
            color: "text.secondary",
            fontStyle: "italic",
            textAlign: "center",
            py: 5,
            border: "2px dashed",
            borderColor: "grey.200",
            borderRadius: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography>
            Brak zaplanowanych pozycji sędziów.
            <br />
            Dodaj nowy wpis do planu.
          </Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
            <Button
              variant="contained"
              onClick={() => openAddRefereePlanDialog()}
              disabled={tournament.teams.length < 2}
            >
              Dodaj
            </Button>
            <Button variant="outlined" onClick={openNewDayRefereePlanTable} disabled={tournament.teams.length < 2}>
              Nowy dzień
            </Button>
          </Box>
        </Box>
      ) : (
        <>
          <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 2 }}>
            <Button variant="outlined" onClick={openNewDayRefereePlanTable} disabled={tournament.teams.length < 2}>
              Nowy dzień
            </Button>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {scheduleTableDayTimestamps.map((dayTimestamp) => {
              const dayMatches = matches.filter((m) => getMatchDayTimestamp(m.scheduledAt) === dayTimestamp);
              const dayLabel = getScheduleDayLabel(dayTimestamp);
              const dayHighlight = isDayOutOfRange?.(dayTimestamp) ?? false;

              return (
                <Box key={dayTimestamp}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 900,
                      mb: 2,
                      ...(dayHighlight
                        ? {
                            color: "common.white",
                            bgcolor: "error.main",
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            display: "inline-block",
                          }
                        : {}),
                    }}
                  >
                    {dayLabel}
                  </Typography>

                  {dayMatches.length === 0 ? (
                    <Box
                      sx={{
                        color: "text.secondary",
                        fontStyle: "italic",
                        textAlign: "center",
                        py: 4,
                        border: "2px dashed",
                        borderColor: "grey.200",
                        borderRadius: 2,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <Typography>Brak zaplanowanych meczów w tym dniu.</Typography>
                      <Button
                        variant="contained"
                        onClick={() => openAddRefereePlanDialog(dayTimestamp)}
                        disabled={tournament.teams.length < 2}
                      >
                        Dodaj wpis sędziów
                      </Button>
                    </Box>
                  ) : (
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
                      <Table size="small" aria-label={`Tabela planu sędziów: ${dayLabel}`}>
                        <TableHead>
                          <TableRow>
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
                          {dayMatches.map((m) => {
                            // Jeśli drużyna została usunięta z turnieju, jej nazwa już nie istnieje w `tournament.teams`.
                            // Wtedy pokazujemy „—” zamiast surowego ID.
                            const teamAName = tournament.teams.find((t) => t.id === m.teamAId)?.name ?? "—";
                            const teamBName = tournament.teams.find((t) => t.id === m.teamBId)?.name ?? "—";

                            const startD = new Date(m.scheduledAt);
                            const endD = new Date(startD.getTime() + MATCH_DURATION_MS);
                            const startTime = !Number.isNaN(startD.getTime())
                              ? startD.toLocaleTimeString("pl-PL", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                })
                              : "—";
                            const endTime = !Number.isNaN(endD.getTime())
                              ? endD.toLocaleTimeString("pl-PL", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                })
                              : "—";

                            const assignments = refereePlanByMatchId[m.id] ?? {};
                            const ref1 = assignments.REFEREE_1;
                            const ref2 = assignments.REFEREE_2;
                            const tablePenalty = assignments.TABLE_PENALTY;
                            const tableClock = assignments.TABLE_CLOCK;

                            const ref1Name = ref1 ? tournament.referees.find((r) => r.id === ref1) : undefined;
                            const ref2Name = ref2 ? tournament.referees.find((r) => r.id === ref2) : undefined;
                            const tablePenaltyName = tablePenalty
                              ? tournament.referees.find((r) => r.id === tablePenalty)
                              : undefined;
                            const tableClockName = tableClock
                              ? tournament.referees.find((r) => r.id === tableClock)
                              : undefined;

                            const rowOut = isMatchOutOfRange?.(m.scheduledAt) ?? false;

                            return (
                              <TableRow key={m.id}>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>
                                  {teamAName}
                                </TableCell>
                                <TableCell align="center" sx={rowOut ? outOfRangeTimeCellSx : undefined}>
                                  {startTime}
                                </TableCell>
                                <TableCell align="center" sx={rowOut ? outOfRangeTimeCellSx : undefined}>
                                  {endTime}
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>
                                  {teamBName}
                                </TableCell>
                                <TableCell align="center">{m.court ?? "—"}</TableCell>
                                <TableCell align="center">{ref1Name ? personDisplayName(ref1Name) : "—"}</TableCell>
                                <TableCell align="center">{ref2Name ? personDisplayName(ref2Name) : "—"}</TableCell>
                                <TableCell align="center">
                                  {tablePenaltyName ? personDisplayName(tablePenaltyName) : "—"}
                                </TableCell>
                                <TableCell align="center">
                                  {tableClockName ? personDisplayName(tableClockName) : "—"}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}

                  <Box sx={{ display: "flex", justifyContent: "flex-start", mt: 2, gap: 2 }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => openEditRefereePlanDialog(dayMatches)}
                      disabled={dayMatches.length === 0}
                    >
                      Edytuj
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => setMatchDayToDelete(dayTimestamp)}
                      disabled={deleteMatchDayLoading && matchDayToDelete === dayTimestamp}
                    >
                      Usuń dzień
                    </Button>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </>
      )}
    </Paper>
  );
}
