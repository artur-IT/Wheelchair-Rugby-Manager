import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useRef } from "react";
import DataLoadAlert from "@/components/ui/DataLoadAlert";
import type { Match, Tournament } from "@/types";
import { MATCH_DURATION_MS } from "@/features/tournaments/components/Tournaments/TournamentDetails/hooks/matchPlanHelpers";
import { printElementAsLandscapePdf } from "@/lib/print";

/** Highlight for match times when the scheduled day is outside tournament dates. */
const outOfRangeTimeCellSx = {
  bgcolor: "error.main",
  color: "common.white",
  fontWeight: 700,
} as const;

function getTeamNameColor(scoreA?: number, scoreB?: number, side?: "A" | "B") {
  const hasBothScores = typeof scoreA === "number" && typeof scoreB === "number";
  if (!hasBothScores || !side) return "text.primary";
  if (scoreA === scoreB) return "warning.main";
  if (side === "A") return scoreA > scoreB ? "success.main" : "error.main";
  return scoreB > scoreA ? "success.main" : "error.main";
}

interface TournamentMatchesPlanPanelProps {
  tournament: Tournament;
  matches: Match[];
  matchesLoading: boolean;
  matchesError: string | null;
  onRetryMatches?: () => void;
  scheduleTableDayTimestamps: number[];
  parseJerseyInfo: (jerseyInfo?: string) => { teamA: "jasne" | "ciemne"; teamB: "jasne" | "ciemne" };
  jerseyValueToNounLabel: (value: "jasne" | "ciemne") => string;
  getMatchDayTimestamp: (scheduledAtIso: string) => number;
  getScheduleDayLabel: (timestamp: number) => string;
  openAddMatchDialog: (presetDayTimestamp?: number | null, allowedDays?: number[] | null) => void;
  openNewDayTable: () => void;
  openEditMatchDialog: (matchesToEdit: Match[]) => void;
  setMatchDayToDelete: (timestamp: number) => void;
  deleteMatchDayLoading: boolean;
  matchDayToDelete: number | null;
  /** When set, Start/Koniec cells and day headings use error styling if outside tournament window. */
  isMatchOutOfRange?: (scheduledAtIso: string) => boolean;
  isDayOutOfRange?: (dayTimestamp: number) => boolean;
}

export default function TournamentMatchesPlanPanel({
  tournament,
  matches,
  matchesLoading,
  matchesError,
  onRetryMatches,
  scheduleTableDayTimestamps,
  parseJerseyInfo,
  jerseyValueToNounLabel,
  getMatchDayTimestamp,
  getScheduleDayLabel,
  openAddMatchDialog,
  openNewDayTable,
  openEditMatchDialog,
  setMatchDayToDelete,
  deleteMatchDayLoading,
  matchDayToDelete,
  isMatchOutOfRange,
  isDayOutOfRange,
}: TournamentMatchesPlanPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  const tournamentDateRangeLabel = (() => {
    const start = new Date(tournament.startDate);
    const end = tournament.endDate ? new Date(tournament.endDate) : null;

    if (Number.isNaN(start.getTime())) return "";
    if (!end || Number.isNaN(end.getTime())) return start.toLocaleDateString("pl-PL");
    return `${start.toLocaleDateString("pl-PL")} - ${end.toLocaleDateString("pl-PL")}`;
  })();

  function handlePrintPlan() {
    if (!panelRef.current) return;
    printElementAsLandscapePdf(`Plan rozgrywek - ${tournament.name}`, panelRef.current, tournamentDateRangeLabel);
  }

  return (
    <Paper
      ref={panelRef}
      sx={{
        p: 4,
        borderRadius: 3,
        bgcolor: "#F1F7FC",
        border: "1px solid",
        borderColor: "grey.200",
      }}
    >
      <Typography className="wr-print-duplicate-title" variant="h6" sx={{ fontWeight: "bold", mb: 3 }}>
        Plan Rozgrywek
      </Typography>
      {matchesLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
          <CircularProgress size={24} />
        </Box>
      ) : matchesError ? (
        <DataLoadAlert message={matchesError} onRetry={onRetryMatches} />
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
            Brak zaplanowanych meczów.
            <br />
            Dodaj nowy mecz do planu.
          </Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
            <Button variant="contained" onClick={() => openAddMatchDialog()} disabled={tournament.teams.length < 2}>
              Dodaj
            </Button>
          </Box>
        </Box>
      ) : (
        <>
          <Box className="wr-print-hide" sx={{ display: "flex", justifyContent: "flex-start", mb: 2, gap: 2 }}>
            <Button variant="outlined" onClick={openNewDayTable} disabled={tournament.teams.length < 2}>
              Nowy dzień
            </Button>
            <Button variant="contained" onClick={handlePrintPlan}>
              Wydrukuj
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
                        onClick={() => openAddMatchDialog(dayTimestamp)}
                        disabled={tournament.teams.length < 2}
                      >
                        Dodaj mecz
                      </Button>
                    </Box>
                  ) : (
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
                      <Table size="small" aria-label={`Tabela planu rozgrywek: ${dayLabel}`}>
                        <TableHead
                          sx={{
                            bgcolor: "#dbeafe",
                            "& .MuiTableCell-root": {
                              whiteSpace: "nowrap",
                              fontWeight: 700,
                            },
                          }}
                        >
                          <TableRow>
                            <TableCell align="center">Drużyna A</TableCell>
                            <TableCell align="center">Punkty A</TableCell>
                            <TableCell align="center">Start</TableCell>
                            <TableCell align="center">Koniec</TableCell>
                            <TableCell align="center">Punkty B</TableCell>
                            <TableCell align="center">Drużyna B</TableCell>
                            <TableCell align="center">Boisko</TableCell>
                            <TableCell align="center">Koszulki</TableCell>
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
                            const { teamA: jerseyA, teamB: jerseyB } = parseJerseyInfo(m.jerseyInfo);
                            const rowOut = isMatchOutOfRange?.(m.scheduledAt) ?? false;

                            return (
                              <TableRow key={m.id}>
                                <TableCell
                                  align="center"
                                  sx={{ fontWeight: 600, color: getTeamNameColor(m.scoreA, m.scoreB, "A") }}
                                >
                                  {teamAName}
                                </TableCell>
                                <TableCell align="center" sx={{ fontSize: "1.4rem" }}>
                                  {m.scoreA ?? "—"}
                                </TableCell>
                                <TableCell align="center" sx={rowOut ? outOfRangeTimeCellSx : undefined}>
                                  {startTime}
                                </TableCell>
                                <TableCell align="center" sx={rowOut ? outOfRangeTimeCellSx : undefined}>
                                  {endTime}
                                </TableCell>
                                <TableCell align="center" sx={{ fontSize: "1.4rem" }}>
                                  {m.scoreB ?? "—"}
                                </TableCell>
                                <TableCell
                                  align="center"
                                  sx={{ fontWeight: 600, color: getTeamNameColor(m.scoreA, m.scoreB, "B") }}
                                >
                                  {teamBName}
                                </TableCell>
                                <TableCell align="center">{m.court ?? "—"}</TableCell>
                                <TableCell align="center" sx={{ minWidth: 260 }}>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      flexDirection: "column",
                                      alignItems: "center",
                                    }}
                                  >
                                    <Typography
                                      variant="body2"
                                      component="div"
                                      sx={{ textAlign: "center", whiteSpace: "pre-line" }}
                                    >
                                      {`A: ${jerseyValueToNounLabel(jerseyA)}\nB: ${jerseyValueToNounLabel(jerseyB)}`}
                                    </Typography>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}

                  <Box className="wr-print-hide" sx={{ display: "flex", justifyContent: "flex-start", mt: 2, gap: 2 }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => openEditMatchDialog(dayMatches)}
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
                      Usuń
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
