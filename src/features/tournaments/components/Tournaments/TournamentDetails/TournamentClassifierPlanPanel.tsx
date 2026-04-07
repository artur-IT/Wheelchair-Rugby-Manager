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
import { useMemo, useRef } from "react";
import DataLoadAlert from "@/components/ui/DataLoadAlert";
import { printElementAsPdf } from "@/lib/print";
import type { Tournament } from "@/types";

interface TournamentClassifierPlanPanelProps {
  tournament: Tournament;
  rows: {
    examId: string;
    playerId: string;
    scheduledAt: string;
    endsAt: string;
    classification?: number;
    observation: boolean;
  }[];
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  scheduleTableDayTimestamps: number[];
  getScheduleDayLabel: (timestamp: number) => string;
  openAddDialog: (presetDayTimestamp?: number | null, allowedDays?: number[] | null) => void;
  openNewDayTable: () => void;
  canCreateNewDay: boolean;
  hasMatches: boolean;
  openEditDialog: (dayTimestamp: number) => void;
  setDayToDelete: (timestamp: number) => void;
  deleteDayLoading: boolean;
  dayToDelete: number | null;
  /** When set, day headings use error styling if outside tournament window. */
  isDayOutOfRange?: (dayTimestamp: number) => boolean;
}

function toDayTimestamp(iso: string) {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function formatClassification(value: number | undefined) {
  if (value == null) return "—";
  return value.toFixed(1);
}

export default function TournamentClassifierPlanPanel({
  tournament,
  rows,
  loading,
  error,
  onRetry,
  scheduleTableDayTimestamps,
  getScheduleDayLabel,
  openAddDialog,
  openNewDayTable,
  canCreateNewDay,
  hasMatches,
  openEditDialog,
  setDayToDelete,
  deleteDayLoading,
  dayToDelete,
  isDayOutOfRange,
}: TournamentClassifierPlanPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const rowsByDay = useMemo(() => {
    const map = new Map<number, typeof rows>();
    for (const row of rows) {
      const day = toDayTimestamp(row.scheduledAt);
      const current = map.get(day) ?? [];
      current.push(row);
      map.set(day, current);
    }
    return map;
  }, [rows]);

  const players = useMemo(() => tournament.teams.flatMap((t) => t.players ?? []), [tournament.teams]);
  const playerTeamNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const team of tournament.teams) {
      for (const player of team.players ?? []) {
        map.set(player.id, team.name);
      }
    }
    return map;
  }, [tournament.teams]);
  const canAddEntries = players.length > 0;

  function handlePrint() {
    if (!panelRef.current) return;
    printElementAsPdf(`Plan klasyfikatorów - ${tournament.name}`, panelRef.current);
  }

  return (
    <Paper
      ref={panelRef}
      sx={{
        py: 4,
        px: 2,
        borderRadius: 3,
        bgcolor: "background.default",
        alignSelf: { xs: "stretch", lg: "flex-start" },
        width: { xs: "100%", lg: "fit-content" },
        maxWidth: "100%",
        boxSizing: "border-box",
      }}
    >
      <Box className="wr-print-duplicate-title" sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Box sx={{ bgcolor: "info.light", p: 1, borderRadius: 2, color: "info.dark" }}>
          <Typography component="div" sx={{ fontWeight: 900 }}>
            KL
          </Typography>
        </Box>
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          Plan Klasyfikatorów
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
          <CircularProgress size={24} />
        </Box>
      ) : error ? (
        <DataLoadAlert message={error} onRetry={onRetry} />
      ) : scheduleTableDayTimestamps.length === 0 ? (
        <Box
          sx={{
            color: "text.secondary",
            fontStyle: "italic",
            textAlign: "center",
            py: 5,
            border: "2px dashed",
            borderColor: "divider",
            borderRadius: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography>Brak zaplanowanych badań klasyfikacyjnych.</Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
            <Button variant="contained" onClick={() => openAddDialog()} disabled={!canAddEntries}>
              Dodaj
            </Button>
          </Box>
        </Box>
      ) : (
        <>
          <Box className="wr-print-hide" sx={{ display: "flex", justifyContent: "flex-start", mb: 2, gap: 2 }}>
            <Button variant="contained" onClick={() => openAddDialog()} disabled={!canAddEntries}>
              Dodaj
            </Button>
            {hasMatches ? null : (
              <>
                <Button variant="outlined" onClick={openNewDayTable} disabled={!canAddEntries || !canCreateNewDay}>
                  Nowy dzień
                </Button>
                <Button variant="contained" onClick={handlePrint}>
                  Wydrukuj
                </Button>
              </>
            )}
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: 5, width: "100%" }}>
            {scheduleTableDayTimestamps.map((dayTimestamp) => {
              const dayRows = rowsByDay.get(dayTimestamp) ?? [];
              const dayLabel = getScheduleDayLabel(dayTimestamp);
              const dayHighlight = isDayOutOfRange?.(dayTimestamp) ?? false;
              return (
                <Box
                  key={dayTimestamp}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignSelf: { xs: "stretch", lg: "flex-start" },
                    maxWidth: "100%",
                    width: { xs: "100%", lg: "fit-content" },
                    boxSizing: "border-box",
                    bgcolor: "background.paper",
                    border: "1px solid",
                    borderColor: "rgba(212, 212, 212, 0.7)",
                    borderRadius: 3,
                    boxShadow: "0 2px 10px rgba(144, 161, 185, 0.12)",
                    p: 2.5,
                  }}
                >
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
                  {dayRows.length === 0 ? (
                    <Box
                      sx={{
                        color: "text.secondary",
                        fontStyle: "italic",
                        textAlign: "center",
                        py: 4,
                        border: "2px dashed",
                        borderColor: "divider",
                        borderRadius: 2,
                        width: "fit-content",
                        maxWidth: "100%",
                        alignSelf: "center",
                        minWidth: { xs: "min(100%, 280px)", sm: 320 },
                      }}
                    >
                      <Typography>Brak zaplanowanych badań w tym dniu.</Typography>
                      <Button variant="contained" onClick={() => openAddDialog(dayTimestamp)} sx={{ mt: 2 }}>
                        Dodaj badanie
                      </Button>
                    </Box>
                  ) : (
                    <TableContainer
                      component={Paper}
                      sx={{
                        borderRadius: 2,
                        width: "fit-content",
                        maxWidth: "100%",
                        overflowX: "auto",
                        boxShadow: "none",
                        border: "1px solid",
                        borderColor: "rgba(212, 212, 212, 0.55)",
                      }}
                    >
                      <Table
                        size="small"
                        aria-label={`Tabela planu klasyfikatorów: ${dayLabel}`}
                        sx={{
                          tableLayout: "auto",
                          width: "max-content",
                          "& .MuiTableCell-root": {
                            px: 1,
                            borderBottom: "none",
                          },
                        }}
                      >
                        <TableHead
                          sx={{
                            bgcolor: "rgba(75, 168, 222, 0.22)",
                            "& .MuiTableCell-root": {
                              fontWeight: 700,
                              color: "text.primary",
                              py: 1.25,
                            },
                          }}
                        >
                          <TableRow>
                            <TableCell align="center">Zawodnik</TableCell>
                            <TableCell align="center">Start badania</TableCell>
                            <TableCell align="center">Koniec badania</TableCell>
                            <TableCell align="center">Klasyfikacja</TableCell>
                            <TableCell align="center">Obserwacja</TableCell>
                            <TableCell align="center">Drużyna</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {dayRows.map((row) => {
                            const player = players.find((p) => p.id === row.playerId);
                            const teamName = playerTeamNameById.get(row.playerId);
                            const startDate = new Date(row.scheduledAt);
                            const endDate = new Date(row.endsAt);
                            return (
                              <TableRow
                                key={row.examId}
                                sx={{
                                  "&:not(:last-of-type) .MuiTableCell-root": {
                                    borderBottom: "1px solid",
                                    borderBottomColor: "rgba(212, 212, 212, 0.65)",
                                  },
                                }}
                              >
                                <TableCell align="center" sx={{ fontWeight: 600 }}>
                                  {player ? `${player.firstName} ${player.lastName}` : "—"}
                                </TableCell>
                                <TableCell align="center">
                                  {startDate.toLocaleTimeString("pl-PL", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: false,
                                  })}
                                </TableCell>
                                <TableCell align="center">
                                  {endDate.toLocaleTimeString("pl-PL", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: false,
                                  })}
                                </TableCell>
                                <TableCell align="center">{formatClassification(row.classification)}</TableCell>
                                <TableCell align="center">{row.observation ? "Tak" : "Nie"}</TableCell>
                                <TableCell align="center">{teamName ?? "—"}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}

                  <Box className="wr-print-hide" sx={{ display: "flex", justifyContent: "flex-start", mt: 2, gap: 2 }}>
                    <Button variant="outlined" onClick={() => openEditDialog(dayTimestamp)}>
                      Edytuj
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => setDayToDelete(dayTimestamp)}
                      disabled={deleteDayLoading && dayToDelete === dayTimestamp}
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
