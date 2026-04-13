import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Alert, Box, Collapse, Typography, CircularProgress } from "@mui/material";
import { ChevronDown } from "lucide-react";
import QueryProvider from "@/components/QueryProvider/QueryProvider";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import AppShell from "@/components/AppShell/AppShell";
import DataLoadAlert from "@/components/ui/DataLoadAlert";
import TournamentDetailsDialogs from "@/features/tournaments/components/Tournaments/TournamentDetails/TournamentDetailsDialogs";
import TournamentHeader from "@/features/tournaments/components/Tournaments/TournamentDetails/TournamentHeader";
import TournamentInfoPanels from "@/features/tournaments/components/Tournaments/TournamentDetails/TournamentInfoPanels";
import TournamentMatchesPlanPanel from "@/features/tournaments/components/Tournaments/TournamentDetails/TournamentMatchesPlanPanel";
import TournamentRefereePlanPanel from "@/features/tournaments/components/Tournaments/TournamentDetails/TournamentRefereePlanPanel";
import TournamentClassifierPlanPanel from "@/features/tournaments/components/Tournaments/TournamentDetails/TournamentClassifierPlanPanel";
import TournamentTeamsPanel from "@/features/tournaments/components/Tournaments/TournamentDetails/TournamentTeamsPanel";
import TournamentRefereesPanel from "@/features/tournaments/components/Tournaments/TournamentDetails/TournamentRefereesPanel";
import TournamentClassifiersPanel from "@/features/tournaments/components/Tournaments/TournamentDetails/TournamentClassifiersPanel";
import {
  AddMatchDialog,
  EditMatchDialog,
} from "@/features/tournaments/components/Tournaments/TournamentDetails/dialogs/MatchPlanDialogs";
import { AddRefereePlanDialog } from "@/features/tournaments/components/Tournaments/TournamentDetails/dialogs/RefereePlanDialogs";
import {
  AddClassifierPlanDialog,
  EditClassifierPlanDialog,
} from "@/features/tournaments/components/Tournaments/TournamentDetails/dialogs/ClassifierPlanDialogs";
import useMatchPlanManager from "@/features/tournaments/components/Tournaments/TournamentDetails/hooks/useMatchPlanManager";
import useRefereePlanManager from "@/features/tournaments/components/Tournaments/TournamentDetails/hooks/useRefereePlanManager";
import useClassifierPlanManager from "@/features/tournaments/components/Tournaments/TournamentDetails/hooks/useClassifierPlanManager";
import useTournamentDetails from "@/features/tournaments/components/Tournaments/TournamentDetails/hooks/useTournamentDetails";
import {
  getMatchDayTimestamp,
  parseJerseyInfo,
} from "@/features/tournaments/components/Tournaments/TournamentDetails/hooks/matchPlanHelpers";
import useTournamentPersonnelManager from "@/features/tournaments/components/Tournaments/TournamentDetails/hooks/useTournamentPersonnelManager";
import { deleteTournamentClassifierPlanEntry, deleteTournamentMatch } from "@/lib/api/tournaments";
import { queryKeys } from "@/lib/queryKeys";
import type { Match, Person } from "@/types";

const getPersonDisplayName = (person: Person) => `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim() || "—";

interface TournamentDetailsProps {
  id: string;
}

export default function TournamentDetails({ id }: TournamentDetailsProps) {
  return (
    <ThemeRegistry>
      <AppShell currentPath="/tournaments" containerMaxWidth="xl">
        <QueryProvider>
          <TournamentDetailsContent id={id} />
        </QueryProvider>
      </AppShell>
    </ThemeRegistry>
  );
}

function TournamentDetailsContent({ id }: TournamentDetailsProps) {
  const [showPostEditDateHint, setShowPostEditDateHint] = useState(false);
  const [teamsPersonnelRowExpanded, setTeamsPersonnelRowExpanded] = useState(true);

  const {
    tournament,
    loading,
    error,
    refetchTournament,
    matches,
    matchesLoading,
    matchesError,
    setScheduleDayTimestamps,
    matchDayOptions,
    scheduleTableDayTimestamps,
    getScheduleDayLabel,
    refreshMatches,
    hasMatchesOutsideTournamentRange,
    isDayTimestampOutsideTournamentRange,
  } = useTournamentDetails(id);

  useEffect(() => {
    const key = `wr-tournament-dates-edited:${id}`;
    try {
      if (sessionStorage.getItem(key)) {
        sessionStorage.removeItem(key);
        setShowPostEditDateHint(true);
      }
    } catch {
      /* ignore */
    }
  }, [id]);

  const queryClient = useQueryClient();

  const deleteMatchMutation = useMutation({
    mutationFn: ({ tournamentId, matchId }: { tournamentId: string; matchId: string }) =>
      deleteTournamentMatch(tournamentId, matchId),
    onSuccess: (_, { tournamentId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.detail(tournamentId) });
    },
  });

  const deleteMatchDayMutation = useMutation({
    mutationFn: async ({ tournamentId, matchIds }: { tournamentId: string; matchIds: string[] }) => {
      const results = await Promise.allSettled(matchIds.map((matchId) => deleteTournamentMatch(tournamentId, matchId)));
      const failures = results.filter((r) => r.status === "rejected");
      if (failures.length > 0) {
        throw new Error(`Nie udało się usunąć ${failures.length} z ${matchIds.length} meczów`);
      }
    },
    onSuccess: (_, { tournamentId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.detail(tournamentId) });
    },
  });

  const refereePlanManager = useRefereePlanManager({
    tournament,
    matches,
    matchDayOptions,
    refreshMatches,
  });
  const { add: addRefereePlan } = refereePlanManager;

  const matchManager = useMatchPlanManager({
    tournament,
    matches,
    refreshMatches,
    refreshRefereePlan: refereePlanManager.refreshRefereePlan,
    matchDayOptions,
  });
  const { addMatch, editMatch } = matchManager;
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);
  const [deleteMatchError, setDeleteMatchError] = useState<string | null>(null);

  const [matchDayToDelete, setMatchDayToDelete] = useState<number | null>(null);
  const [deleteMatchDayError, setDeleteMatchDayError] = useState<string | null>(null);
  const [classifierDayToDelete, setClassifierDayToDelete] = useState<number | null>(null);
  const [deleteClassifierDayError, setDeleteClassifierDayError] = useState<string | null>(null);
  const [deleteClassifierDayLoading, setDeleteClassifierDayLoading] = useState(false);

  const personnel = useTournamentPersonnelManager({ tournament });
  const { teams, referees, classifiers } = personnel;
  const classifierPlanManager = useClassifierPlanManager({ tournament, matchDayOptions });
  const { add: addClassifierPlan, edit: editClassifierPlan } = classifierPlanManager;

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <DataLoadAlert message={error} onRetry={refetchTournament} sx={{ mb: 3 }} />;
  }

  if (!tournament) {
    return <Typography>Nie znaleziono turnieju.</Typography>;
  }

  /** Noun form for schedule table rows (e.g. "Jasne" / "Ciemne"). */
  function jerseyValueToNounLabel(value: "jasne" | "ciemne") {
    return value === "jasne" ? "Jasne" : "Ciemne";
  }

  function closeDeleteMatchDialog() {
    if (deleteMatchMutation.isPending) return;
    setMatchToDelete(null);
    setDeleteMatchError(null);
  }

  async function confirmDeleteMatch() {
    if (!tournament || !matchToDelete) return;
    const deletedId = matchToDelete.id;
    setDeleteMatchError(null);

    try {
      await deleteMatchMutation.mutateAsync({ tournamentId: tournament.id, matchId: matchToDelete.id });
      editMatch.setDrafts((prev) => prev.filter((d) => d.id !== deletedId));
      if (editMatch.match?.id === deletedId) editMatch.setMatch(null);
      setMatchToDelete(null);
    } catch (e) {
      setDeleteMatchError(e instanceof Error ? e.message : "Nie udało się usunąć meczu");
    }
  }

  function closeDeleteMatchDayDialog() {
    if (deleteMatchDayMutation.isPending) return;
    setMatchDayToDelete(null);
    setDeleteMatchDayError(null);
  }

  async function confirmDeleteMatchDay() {
    if (!tournament || matchDayToDelete == null) return;
    setDeleteMatchDayError(null);

    try {
      const dayMatches = matches.filter((m) => getMatchDayTimestamp(m.scheduledAt) === matchDayToDelete);
      const matchIds = dayMatches.map((m) => m.id);

      await deleteMatchDayMutation.mutateAsync({ tournamentId: tournament.id, matchIds });
      setScheduleDayTimestamps((prev) => prev.filter((ts) => ts !== matchDayToDelete));
      setMatchDayToDelete(null);
    } catch (e) {
      setDeleteMatchDayError(e instanceof Error ? e.message : "Nie udało się usunąć dnia");
    }
  }

  async function confirmDeleteClassifierDay() {
    if (!tournament || classifierDayToDelete == null) return;
    setDeleteClassifierDayError(null);
    setDeleteClassifierDayLoading(true);

    try {
      const toDelete = classifierPlanManager.classifierPlanRows.filter(
        (row) => getMatchDayTimestamp(row.scheduledAt) === classifierDayToDelete
      );
      const results = await Promise.allSettled(
        toDelete.map((row) => deleteTournamentClassifierPlanEntry(tournament.id, row.examId))
      );
      const failures = results.filter((r) => r.status === "rejected");
      if (failures.length > 0) {
        throw new Error(`Nie udało się usunąć ${failures.length} z ${toDelete.length} wpisów`);
      }
      await classifierPlanManager.refreshClassifierPlan(tournament.id);
      classifierPlanManager.removeDay(classifierDayToDelete);
      setClassifierDayToDelete(null);
    } catch (e) {
      setDeleteClassifierDayError(e instanceof Error ? e.message : "Nie udało się usunąć dnia planu klasyfikatorów");
    } finally {
      setDeleteClassifierDayLoading(false);
    }
  }

  // Helper keeps new-day logic shared between match and referee panels.
  const createOpenNewDayHandler = (openDialog: (timestamp: number, options: number[]) => void) => {
    return () => {
      if (!tournament) return;
      if (tournament.teams.length < 2) return;

      const used = new Set(scheduleTableDayTimestamps);
      const freeDayOptions = (matchDayOptions ?? []).filter((o) => !used.has(o.timestamp));
      const nextDay = freeDayOptions[0]?.timestamp ?? null;
      if (!nextDay) return;

      openDialog(
        nextDay,
        freeDayOptions.map((o) => o.timestamp)
      );
    };
  };

  const openNewDayTable = createOpenNewDayHandler(addMatch.openDialog);
  const openNewDayRefereePlanTable = createOpenNewDayHandler(addRefereePlan.openDialog);
  const openNewDayClassifierPlanTable = () => {
    if (!tournament) return;
    const used = new Set(classifierPlanManager.classifierDayTimestamps);
    const freeDayOptions = (matchDayOptions ?? []).filter((o) => !used.has(o.timestamp));
    const nextDay = freeDayOptions[0]?.timestamp ?? null;
    if (!nextDay) return;
    addClassifierPlan.openDialog(
      nextDay,
      freeDayOptions.map((o) => o.timestamp)
    );
  };

  const showScheduleDateAlert = showPostEditDateHint || hasMatchesOutsideTournamentRange;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <TournamentHeader id={id} tournament={tournament} />

      {showScheduleDateAlert ? (
        <Alert
          severity={hasMatchesOutsideTournamentRange ? "error" : "warning"}
          variant="outlined"
          onClose={
            showPostEditDateHint && !hasMatchesOutsideTournamentRange ? () => setShowPostEditDateHint(false) : undefined
          }
        >
          {hasMatchesOutsideTournamentRange ? (
            <Typography variant="body2" component="span">
              Część meczów jest zaplanowana poza aktualnymi datami turnieju. Zaktualizuj terminy w planie rozgrywek i w
              planie sędziów.
            </Typography>
          ) : (
            <Typography variant="body2" component="span">
              Daty turnieju zostały zmienione. Sprawdź i zaktualizuj terminy meczów w planie rozgrywek oraz w planie
              sędziów — stare daty nie przesuwają się automatycznie.
            </Typography>
          )}
        </Alert>
      ) : null}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 4, width: "100%", minWidth: 0 }}>
        <TournamentInfoPanels tournament={tournament} />

        <Box
          sx={{
            border: 1,
            borderColor: "divider",
            borderRadius: 3,
            bgcolor: "background.paper",
            overflow: "hidden",
          }}
        >
          <Box
            component="button"
            type="button"
            id="tournament-teams-personnel-toggle"
            onClick={() => setTeamsPersonnelRowExpanded((open) => !open)}
            aria-expanded={teamsPersonnelRowExpanded}
            aria-controls="tournament-teams-personnel-region"
            sx={{
              display: "flex",
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              px: 2,
              py: 1.5,
              border: "none",
              bgcolor: "background.paper",
              cursor: "pointer",
              textAlign: "left",
              "&:hover": { bgcolor: "background.default" },
            }}
          >
            <Typography component="span" variant="subtitle1" sx={{ fontWeight: "bold" }}>
              Drużyny / Sędziowie / Klasyfikatorzy
            </Typography>
            <ChevronDown
              size={22}
              style={{
                flexShrink: 0,
                transition: "transform 0.2s ease",
                transform: teamsPersonnelRowExpanded ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </Box>
          <Collapse in={teamsPersonnelRowExpanded}>
            <Box
              id="tournament-teams-personnel-region"
              role="region"
              aria-labelledby="tournament-teams-personnel-toggle"
              sx={{ p: 2, pt: 0 }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "repeat(3, minmax(0, 1fr))" },
                  gap: 2,
                  width: "100%",
                  minWidth: 0,
                  alignItems: "stretch",
                }}
              >
                <TournamentTeamsPanel
                  tournament={tournament}
                  openAddTeamsDialog={teams.openAddTeamsDialog}
                  openRemoveTeamDialog={teams.openRemoveTeamDialog}
                  openEditTeamPlayersDialog={teams.openEditTeamPlayersDialog}
                  removeTeamLoading={teams.removeTeamLoading}
                  teamToRemove={teams.teamToRemove}
                />

                <TournamentRefereesPanel
                  tournament={tournament}
                  personDisplayName={getPersonDisplayName}
                  openAddRefereesDialog={referees.openAddRefereesDialog}
                  openRemoveRefereeDialog={referees.openRemoveRefereeDialog}
                  removeRefereeLoading={referees.removeRefereeLoading}
                  refereeToRemove={referees.refereeToRemove}
                />

                <TournamentClassifiersPanel
                  tournament={tournament}
                  personDisplayName={getPersonDisplayName}
                  openAddClassifiersDialog={classifiers.openAddClassifiersDialog}
                  openRemoveClassifierDialog={classifiers.openRemoveClassifierDialog}
                  removeClassifierLoading={classifiers.removeClassifierLoading}
                  classifierToRemove={classifiers.classifierToRemove}
                />
              </Box>
            </Box>
          </Collapse>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            gap: 4,
            minWidth: 0,
            width: {
              xs: "calc(100% + 48px)",
              sm: "calc(100% + 64px)",
              md: "calc(100% + 80px)",
              lg: "100%",
            },
            mx: { xs: -3, sm: -4, md: -5, lg: 0 },
          }}
        >
          <TournamentMatchesPlanPanel
            tournament={tournament}
            matches={matches}
            matchesLoading={matchesLoading}
            matchesError={matchesError}
            onRetryMatches={() => void refreshMatches(tournament.id)}
            scheduleTableDayTimestamps={scheduleTableDayTimestamps}
            parseJerseyInfo={parseJerseyInfo}
            jerseyValueToNounLabel={jerseyValueToNounLabel}
            getMatchDayTimestamp={getMatchDayTimestamp}
            getScheduleDayLabel={getScheduleDayLabel}
            openAddMatchDialog={addMatch.openDialog}
            openNewDayTable={openNewDayTable}
            openEditMatchDialog={editMatch.openDialog}
            setMatchDayToDelete={setMatchDayToDelete}
            deleteMatchDayLoading={deleteMatchDayMutation.isPending}
            matchDayToDelete={matchDayToDelete}
            isDayOutOfRange={isDayTimestampOutsideTournamentRange}
          />

          <TournamentRefereePlanPanel
            tournament={tournament}
            matches={matches}
            refereePlanByMatchId={refereePlanManager.refereePlanByMatchId}
            refereePlanLoading={refereePlanManager.refereePlanLoading}
            refereePlanError={refereePlanManager.refereePlanError}
            onRetryRefereePlan={() => void refereePlanManager.refreshRefereePlan(tournament.id)}
            scheduleTableDayTimestamps={scheduleTableDayTimestamps}
            getMatchDayTimestamp={getMatchDayTimestamp}
            getScheduleDayLabel={getScheduleDayLabel}
            openAddRefereePlanDialog={addRefereePlan.openDialog}
            openNewDayRefereePlanTable={openNewDayRefereePlanTable}
            personDisplayName={getPersonDisplayName}
            setMatchDayToDelete={setMatchDayToDelete}
            deleteMatchDayLoading={deleteMatchDayMutation.isPending}
            matchDayToDelete={matchDayToDelete}
            isDayOutOfRange={isDayTimestampOutsideTournamentRange}
          />

          <TournamentClassifierPlanPanel
            tournament={tournament}
            rows={classifierPlanManager.classifierPlanRows}
            loading={classifierPlanManager.classifierPlanLoading}
            error={classifierPlanManager.classifierPlanError}
            onRetry={() => void classifierPlanManager.refreshClassifierPlan(tournament.id)}
            scheduleTableDayTimestamps={classifierPlanManager.classifierDayTimestamps}
            getScheduleDayLabel={getScheduleDayLabel}
            openAddDialog={addClassifierPlan.openDialog}
            openNewDayTable={openNewDayClassifierPlanTable}
            canCreateNewDay={classifierPlanManager.canCreateNewDay}
            hasMatches={matches.length > 0}
            openEditDialog={editClassifierPlan.openDialog}
            setDayToDelete={setClassifierDayToDelete}
            deleteDayLoading={deleteClassifierDayLoading}
            dayToDelete={classifierDayToDelete}
            isDayOutOfRange={isDayTimestampOutsideTournamentRange}
          />
        </Box>
      </Box>

      <AddMatchDialog addMatch={addMatch} tournament={tournament} />
      <EditMatchDialog
        editMatch={editMatch}
        tournament={tournament}
        matches={matches}
        deleteMatchLoading={deleteMatchMutation.isPending}
        setMatchToDelete={setMatchToDelete}
        setDeleteMatchError={setDeleteMatchError}
      />

      <AddRefereePlanDialog
        addRefereePlan={addRefereePlan}
        tournament={tournament}
        personDisplayName={getPersonDisplayName}
      />
      <AddClassifierPlanDialog addClassifierPlan={addClassifierPlan} tournament={tournament} />
      <EditClassifierPlanDialog editClassifierPlan={editClassifierPlan} tournament={tournament} />
      <TournamentDetailsDialogs
        tournament={tournament}
        matchToDelete={matchToDelete}
        matchDayToDelete={matchDayToDelete}
        classifierDayToDelete={classifierDayToDelete}
        deleteMatchLoading={deleteMatchMutation.isPending}
        deleteMatchError={deleteMatchError}
        deleteMatchDayLoading={deleteMatchDayMutation.isPending}
        deleteMatchDayError={deleteMatchDayError}
        deleteClassifierDayLoading={deleteClassifierDayLoading}
        deleteClassifierDayError={deleteClassifierDayError}
        getScheduleDayLabel={getScheduleDayLabel}
        closeDeleteMatchDialog={closeDeleteMatchDialog}
        confirmDeleteMatch={confirmDeleteMatch}
        closeDeleteMatchDayDialog={closeDeleteMatchDayDialog}
        confirmDeleteMatchDay={confirmDeleteMatchDay}
        closeDeleteClassifierDayDialog={() => setClassifierDayToDelete(null)}
        confirmDeleteClassifierDay={confirmDeleteClassifierDay}
        teams={teams}
        referees={referees}
        classifiers={classifiers}
        getPersonDisplayName={getPersonDisplayName}
      />
    </Box>
  );
}
