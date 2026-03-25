import {
  Alert,
  Box,
  Button,
  CircularProgress,
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
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import DataLoadAlert from "@/components/ui/DataLoadAlert";
import type { Match, Person, RefereeRole, Tournament } from "@/types";
import { MATCH_DURATION_MS } from "@/features/tournaments/components/Tournaments/TournamentDetails/hooks/matchPlanHelpers";
import { updateTournamentRefereePlanEntry } from "@/lib/api/tournaments";
import { printElementAsLandscapePdf } from "@/lib/print";
import { queryKeys } from "@/lib/queryKeys";

const outOfRangeTimeCellSx = {
  bgcolor: "error.main",
  color: "common.white",
  fontWeight: 700,
} as const;

const refereeSelectSx = {
  "& .MuiSelect-select": {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    lineHeight: 1.25,
    pt: 1.25,
    pb: 0.5,
    px: 1,
    minHeight: "unset",
    boxSizing: "border-box",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    top: 0,
  },
  "@media print": {
    "& .MuiOutlinedInput-notchedOutline": {
      border: 0,
    },
    "& .MuiSelect-icon": {
      display: "none",
    },
    "& .MuiSelect-select": {
      pr: 1,
    },
  },
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
  personDisplayName: (p: Person) => string;
  setMatchDayToDelete: (timestamp: number) => void;
  deleteMatchDayLoading: boolean;
  matchDayToDelete: number | null;
  isMatchOutOfRange?: (scheduledAtIso: string) => boolean;
  isDayOutOfRange?: (dayTimestamp: number) => boolean;
}

function roleToPayloadKey(role: RefereeRole) {
  switch (role) {
    case "REFEREE_1":
      return "referee1Id";
    case "REFEREE_2":
      return "referee2Id";
    case "TABLE_PENALTY":
      return "tablePenaltyId";
    case "TABLE_CLOCK":
      return "tableClockId";
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
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
  personDisplayName,
  isMatchOutOfRange,
  isDayOutOfRange,
}: TournamentRefereePlanPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();
  const [inlineSaveError, setInlineSaveError] = useState<string | null>(null);

  const savingMatchIds = useMemo(() => new Set<string>(), []);
  const [, forceRerender] = useState(0);

  const inlineSaveMutation = useMutation({
    mutationFn: async (args: { match: Match; nextAssignments: Partial<Record<RefereeRole, string>> }) => {
      const payload: {
        teamAId: string;
        teamBId: string;
        scheduledAt: string;
        court?: string;
        referee1Id?: string;
        referee2Id?: string;
        tablePenaltyId?: string;
        tableClockId?: string;
      } = {
        teamAId: args.match.teamAId,
        teamBId: args.match.teamBId,
        scheduledAt: args.match.scheduledAt,
        court: args.match.court,
      };

      (Object.keys(args.nextAssignments) as RefereeRole[]).forEach((role) => {
        const key = roleToPayloadKey(role);
        const value = args.nextAssignments[role];
        payload[key] = typeof value === "string" && value.trim().length > 0 ? value : undefined;
      });

      return updateTournamentRefereePlanEntry(tournament.id, args.match.id, payload);
    },
    onSuccess: async () => {
      setInlineSaveError(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.refereePlan(tournament.id) });
    },
    onError: (e) => {
      setInlineSaveError(e instanceof Error ? e.message : "Nie udało się zapisać planu sędziów");
    },
  });

  const tournamentDateRangeLabel = (() => {
    const start = new Date(tournament.startDate);
    const end = tournament.endDate ? new Date(tournament.endDate) : null;

    if (Number.isNaN(start.getTime())) return "";
    if (!end || Number.isNaN(end.getTime())) return start.toLocaleDateString("pl-PL");
    return `${start.toLocaleDateString("pl-PL")} - ${end.toLocaleDateString("pl-PL")}`;
  })();

  function handlePrintPlan() {
    if (!panelRef.current) return;
    printElementAsLandscapePdf(`Plan sędziów - ${tournament.name}`, panelRef.current, tournamentDateRangeLabel);
  }

  return (
    <Paper
      ref={panelRef}
      sx={{
        p: 4,
        borderRadius: 3,
        bgcolor: "#fff7ed",
        border: "1px solid",
        borderColor: "grey.200",
      }}
    >
      <Box className="wr-print-duplicate-title" sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
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
              disabled={tournament.teams.length < 2 || matches.length === 0}
            >
              Dodaj
            </Button>
          </Box>
        </Box>
      ) : (
        <>
          <Box className="wr-print-hide" sx={{ display: "flex", justifyContent: "flex-start", mb: 2, gap: 2 }}>
            <Button variant="contained" onClick={handlePrintPlan}>
              Wydrukuj
            </Button>
          </Box>

          {inlineSaveError ? (
            <Alert className="wr-print-hide" severity="error" sx={{ mb: 2 }}>
              {inlineSaveError}
            </Alert>
          ) : null}

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
                        <TableHead
                          sx={{
                            bgcolor: "#ffedd5",
                            "& .MuiTableCell-root": {
                              fontWeight: 700,
                            },
                          }}
                        >
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

                            const isSaving = savingMatchIds.has(m.id);

                            const rowOut = isMatchOutOfRange?.(m.scheduledAt) ?? false;

                            const setRole = async (role: RefereeRole, refereeId: string) => {
                              if (isSaving) return;
                              setInlineSaveError(null);

                              savingMatchIds.add(m.id);
                              forceRerender((x) => x + 1);

                              const nextAssignments: Partial<Record<RefereeRole, string>> = {
                                REFEREE_1: ref1 ?? "",
                                REFEREE_2: ref2 ?? "",
                                TABLE_PENALTY: tablePenalty ?? "",
                                TABLE_CLOCK: tableClock ?? "",
                                [role]: refereeId,
                              };

                              try {
                                await inlineSaveMutation.mutateAsync({ match: m, nextAssignments });
                              } finally {
                                savingMatchIds.delete(m.id);
                                forceRerender((x) => x + 1);
                              }
                            };

                            const optionDisabled = (
                              candidateId: string,
                              currentValue: string | undefined,
                              conflicts: string[]
                            ) => candidateId !== currentValue && conflicts.includes(candidateId);

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

                                <TableCell align="center" sx={{ minWidth: 180 }}>
                                  <TextField
                                    select
                                    size="small"
                                    sx={refereeSelectSx}
                                    value={ref1 ?? ""}
                                    onChange={(e) => void setRole("REFEREE_1", String(e.target.value))}
                                    disabled={isSaving}
                                    fullWidth
                                  >
                                    <MenuItem value="">—</MenuItem>
                                    {tournament.referees.map((r) => (
                                      <MenuItem
                                        key={r.id}
                                        value={r.id}
                                        disabled={optionDisabled(r.id, ref1, [
                                          ref2 ?? "",
                                          tablePenalty ?? "",
                                          tableClock ?? "",
                                        ])}
                                      >
                                        {personDisplayName(r)}
                                      </MenuItem>
                                    ))}
                                  </TextField>
                                </TableCell>

                                <TableCell align="center" sx={{ minWidth: 180 }}>
                                  <TextField
                                    select
                                    size="small"
                                    sx={refereeSelectSx}
                                    value={ref2 ?? ""}
                                    onChange={(e) => void setRole("REFEREE_2", String(e.target.value))}
                                    disabled={isSaving}
                                    fullWidth
                                  >
                                    <MenuItem value="">—</MenuItem>
                                    {tournament.referees.map((r) => (
                                      <MenuItem
                                        key={r.id}
                                        value={r.id}
                                        disabled={optionDisabled(r.id, ref2, [
                                          ref1 ?? "",
                                          tablePenalty ?? "",
                                          tableClock ?? "",
                                        ])}
                                      >
                                        {personDisplayName(r)}
                                      </MenuItem>
                                    ))}
                                  </TextField>
                                </TableCell>

                                <TableCell align="center" sx={{ minWidth: 180 }}>
                                  <TextField
                                    select
                                    size="small"
                                    sx={refereeSelectSx}
                                    value={tablePenalty ?? ""}
                                    onChange={(e) => void setRole("TABLE_PENALTY", String(e.target.value))}
                                    disabled={isSaving}
                                    fullWidth
                                  >
                                    <MenuItem value="">—</MenuItem>
                                    {tournament.referees.map((r) => (
                                      <MenuItem
                                        key={r.id}
                                        value={r.id}
                                        disabled={optionDisabled(r.id, tablePenalty, [
                                          ref1 ?? "",
                                          ref2 ?? "",
                                          tableClock ?? "",
                                        ])}
                                      >
                                        {personDisplayName(r)}
                                      </MenuItem>
                                    ))}
                                  </TextField>
                                </TableCell>

                                <TableCell align="center" sx={{ minWidth: 180 }}>
                                  <TextField
                                    select
                                    size="small"
                                    sx={refereeSelectSx}
                                    value={tableClock ?? ""}
                                    onChange={(e) => void setRole("TABLE_CLOCK", String(e.target.value))}
                                    disabled={isSaving}
                                    fullWidth
                                  >
                                    <MenuItem value="">—</MenuItem>
                                    {tournament.referees.map((r) => (
                                      <MenuItem
                                        key={r.id}
                                        value={r.id}
                                        disabled={optionDisabled(r.id, tableClock, [
                                          ref1 ?? "",
                                          ref2 ?? "",
                                          tablePenalty ?? "",
                                        ])}
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
                  )}
                </Box>
              );
            })}
          </Box>
        </>
      )}
    </Paper>
  );
}
