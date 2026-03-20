import { useState } from "react";
import { MapPin } from "lucide-react";
import { Box, Typography, Paper, Link as MuiLink, CircularProgress, Alert } from "@mui/material";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import AppShell from "@/components/AppShell/AppShell";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import TournamentHeader from "@/components/TournamentDetails/TournamentHeader";
import TournamentMatchesPlanPanel from "@/components/TournamentDetails/TournamentMatchesPlanPanel";
import TournamentRefereePlanPanel from "@/components/TournamentDetails/TournamentRefereePlanPanel";
import TournamentTeamsPanel from "@/components/TournamentDetails/TournamentTeamsPanel";
import TournamentPersonnelPanels from "@/components/TournamentDetails/TournamentPersonnelPanels";
import SelectionDialog from "@/components/TournamentDetails/SelectionDialog";
import { AddMatchDialog, EditMatchDialog } from "@/components/TournamentDetails/dialogs/MatchPlanDialogs";
import { AddRefereePlanDialog, EditRefereePlanDialog } from "@/components/TournamentDetails/dialogs/RefereePlanDialogs";
import useMatchPlanManager from "@/components/TournamentDetails/hooks/useMatchPlanManager";
import useRefereePlanManager from "@/components/TournamentDetails/hooks/useRefereePlanManager";
import useTournamentDetails from "@/components/TournamentDetails/hooks/useTournamentDetails";
import { getMatchDayTimestamp, parseJerseyInfo } from "@/components/TournamentDetails/hooks/matchPlanHelpers";
import useTournamentPersonnelManager from "@/components/TournamentDetails/hooks/useTournamentPersonnelManager";
import type { Match, Person } from "@/types";

const getPersonDisplayName = (person: Person) => `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim() || "—";

interface TournamentDetailsProps {
  id: string;
}

export default function TournamentDetails({ id }: TournamentDetailsProps) {
  return (
    <ThemeRegistry>
      <AppShell currentPath="/tournaments">
        <TournamentDetailsContent id={id} />
      </AppShell>
    </ThemeRegistry>
  );
}

function TournamentDetailsContent({ id }: TournamentDetailsProps) {
  const {
    tournament,
    loading,
    error,
    matches,
    matchesLoading,
    matchesError,
    setScheduleDayTimestamps,
    matchDayOptions,
    scheduleTableDayTimestamps,
    getScheduleDayLabel,
    refreshTournament,
    refreshMatches,
  } = useTournamentDetails(id);

  const refereePlanManager = useRefereePlanManager({
    tournament,
    matches,
    matchDayOptions,
    refreshMatches,
  });
  const { add: addRefereePlan, edit: editRefereePlan } = refereePlanManager;

  const matchManager = useMatchPlanManager({
    tournament,
    refreshMatches,
    refreshRefereePlan: refereePlanManager.refreshRefereePlan,
    matchDayOptions,
  });
  const { addMatch, editMatch } = matchManager;
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);
  const [deleteMatchLoading, setDeleteMatchLoading] = useState(false);
  const [deleteMatchError, setDeleteMatchError] = useState<string | null>(null);

  const [matchDayToDelete, setMatchDayToDelete] = useState<number | null>(null);
  const [deleteMatchDayLoading, setDeleteMatchDayLoading] = useState(false);
  const [deleteMatchDayError, setDeleteMatchDayError] = useState<string | null>(null);

  const personnel = useTournamentPersonnelManager({ tournament, refreshTournament });
  const { teams, referees, classifiers } = personnel;

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (!tournament) {
    return <Typography>Nie znaleziono turnieju.</Typography>;
  }

  const formatDateRange = (start: string, end?: string) => {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : null;

    if (Number.isNaN(startDate.getTime())) {
      return end && !Number.isNaN(endDate?.getTime() ?? NaN) ? (endDate?.toLocaleDateString("pl-PL") ?? "") : "";
    }

    if (!endDate || Number.isNaN(endDate.getTime())) {
      return startDate.toLocaleDateString("pl-PL");
    }

    return `${startDate.toLocaleDateString("pl-PL")} - ${endDate.toLocaleDateString("pl-PL")}`;
  };

  /** Noun form for schedule table rows (e.g. "Jasne" / "Ciemne"). */
  function jerseyValueToNounLabel(value: "jasne" | "ciemne") {
    return value === "jasne" ? "Jasne" : "Ciemne";
  }

  function closeDeleteMatchDialog() {
    if (deleteMatchLoading) return;
    setMatchToDelete(null);
    setDeleteMatchError(null);
  }

  async function confirmDeleteMatch() {
    if (!tournament || !matchToDelete) return;
    const deletedId = matchToDelete.id;
    setDeleteMatchLoading(true);
    setDeleteMatchError(null);

    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/matches/${matchToDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Nie udało się usunąć meczu");
      }

      await refreshMatches(tournament.id);
      await refereePlanManager.refreshRefereePlan(tournament.id);
      // Jeśli edytujemy plan w tym samym komponencie, usuń wiersz z formularza od razu.
      editMatch.setDrafts((prev) => prev.filter((d) => d.id !== deletedId));
      editRefereePlan.setDrafts((prev) => prev.filter((d) => d.id !== deletedId));
      if (editMatch.match?.id === deletedId) editMatch.setMatch(null);
      setMatchToDelete(null);
    } catch (e) {
      setDeleteMatchError(e instanceof Error ? e.message : "Nie udało się usunąć meczu");
    } finally {
      setDeleteMatchLoading(false);
    }
  }

  function closeDeleteMatchDayDialog() {
    if (deleteMatchDayLoading) return;
    setMatchDayToDelete(null);
    setDeleteMatchDayError(null);
  }

  async function confirmDeleteMatchDay() {
    if (!tournament || matchDayToDelete == null) return;
    setDeleteMatchDayLoading(true);
    setDeleteMatchDayError(null);

    try {
      const dayMatches = matches.filter((m) => getMatchDayTimestamp(m.scheduledAt) === matchDayToDelete);

      // Usuwamy wszystkie mecze z danego dnia (API wspiera usuwanie pojedynczego meczu).
      for (const m of dayMatches) {
        const res = await fetch(`/api/tournaments/${tournament.id}/matches/${m.id}`, { method: "DELETE" });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(data?.error || "Nie udało się usunąć dnia");
        }
      }

      await refreshMatches(tournament.id);
      await refereePlanManager.refreshRefereePlan(tournament.id);
      setScheduleDayTimestamps((prev) => prev.filter((ts) => ts !== matchDayToDelete));
      setMatchDayToDelete(null);
    } catch (e) {
      setDeleteMatchDayError(e instanceof Error ? e.message : "Nie udało się usunąć dnia");
    } finally {
      setDeleteMatchDayLoading(false);
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

      setScheduleDayTimestamps((prev) => {
        const merged = Array.from(new Set([...prev, nextDay]));
        merged.sort((a, b) => a - b);
        return merged;
      });

      openDialog(
        nextDay,
        freeDayOptions.map((o) => o.timestamp)
      );
    };
  };

  const openNewDayTable = createOpenNewDayHandler(addMatch.openDialog);
  const openNewDayRefereePlanTable = createOpenNewDayHandler(addRefereePlan.openDialog);

  const venue = tournament.venue;
  const accommodation = tournament.accommodation;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <TournamentHeader id={id} tournament={tournament} formatDateRange={formatDateRange} />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
          gap: 4,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 3,
            }}
          >
            {venue ? (
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: "#dbeafe",
                      p: 1,
                      borderRadius: 2,
                      color: "#2563eb",
                    }}
                  >
                    <MapPin size={20} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    Hala Sportowa
                  </Typography>
                </Box>
                <Typography sx={{ fontWeight: 600 }}>{venue.name}</Typography>
                <Typography color="textSecondary" sx={{ mb: 2 }}>
                  {venue.address}
                </Typography>
                {venue.mapUrl ? (
                  <MuiLink
                    href={venue.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    underline="hover"
                    sx={{ fontWeight: "bold", fontSize: "0.875rem" }}
                  >
                    Otwórz w Mapach &rarr;
                  </MuiLink>
                ) : null}
              </Paper>
            ) : null}

            {accommodation ? (
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: "#d1fae5",
                      p: 1,
                      borderRadius: 2,
                      color: "#059669",
                    }}
                  >
                    <MapPin size={20} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    Zakwaterowanie
                  </Typography>
                </Box>
                <Typography sx={{ fontWeight: 600 }}>{accommodation.name}</Typography>
                <Typography color="textSecondary" sx={{ mb: 2 }}>
                  {accommodation.address}
                </Typography>
                {tournament.parking ? (
                  <Typography sx={{ mb: 2 }}>
                    <strong>Parking:</strong> {tournament.parking}
                  </Typography>
                ) : null}
                {accommodation.mapUrl ? (
                  <MuiLink
                    href={accommodation.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    underline="hover"
                    sx={{ fontWeight: "bold", fontSize: "0.875rem" }}
                  >
                    Otwórz w Mapach &rarr;
                  </MuiLink>
                ) : null}
              </Paper>
            ) : null}

            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    bgcolor: "#fff7ed",
                    p: 1,
                    borderRadius: 2,
                    color: "#d97706",
                  }}
                >
                  <MapPin size={20} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  Wyżywienie
                </Typography>
              </Box>
              {tournament.catering ? (
                <Typography sx={{ fontWeight: 600, whiteSpace: "pre-wrap" }}>{tournament.catering}</Typography>
              ) : (
                <Typography color="textSecondary">Brak danych.</Typography>
              )}
            </Paper>
          </Box>

          <TournamentMatchesPlanPanel
            tournament={tournament}
            matches={matches}
            matchesLoading={matchesLoading}
            matchesError={matchesError}
            scheduleTableDayTimestamps={scheduleTableDayTimestamps}
            parseJerseyInfo={parseJerseyInfo}
            jerseyValueToNounLabel={jerseyValueToNounLabel}
            getMatchDayTimestamp={getMatchDayTimestamp}
            getScheduleDayLabel={getScheduleDayLabel}
            openAddMatchDialog={addMatch.openDialog}
            openNewDayTable={openNewDayTable}
            openEditMatchDialog={editMatch.openDialog}
            setMatchDayToDelete={setMatchDayToDelete}
            deleteMatchDayLoading={deleteMatchDayLoading}
            matchDayToDelete={matchDayToDelete}
          />

          <TournamentRefereePlanPanel
            tournament={tournament}
            matches={matches}
            refereePlanByMatchId={refereePlanManager.refereePlanByMatchId}
            refereePlanLoading={refereePlanManager.refereePlanLoading}
            refereePlanError={refereePlanManager.refereePlanError}
            scheduleTableDayTimestamps={scheduleTableDayTimestamps}
            getMatchDayTimestamp={getMatchDayTimestamp}
            getScheduleDayLabel={getScheduleDayLabel}
            openAddRefereePlanDialog={addRefereePlan.openDialog}
            openNewDayRefereePlanTable={openNewDayRefereePlanTable}
            openEditRefereePlanDialog={editRefereePlan.openDialog}
            personDisplayName={getPersonDisplayName}
            setMatchDayToDelete={setMatchDayToDelete}
            deleteMatchDayLoading={deleteMatchDayLoading}
            matchDayToDelete={matchDayToDelete}
          />
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <TournamentTeamsPanel
            tournament={tournament}
            openAddTeamsDialog={teams.openAddTeamsDialog}
            openRemoveTeamDialog={teams.openRemoveTeamDialog}
            removeTeamLoading={teams.removeTeamLoading}
            teamToRemove={teams.teamToRemove}
          />

          <TournamentPersonnelPanels
            tournament={tournament}
            personDisplayName={getPersonDisplayName}
            openAddRefereesDialog={referees.openAddRefereesDialog}
            openRemoveRefereeDialog={referees.openRemoveRefereeDialog}
            removeRefereeLoading={referees.removeRefereeLoading}
            refereeToRemove={referees.refereeToRemove}
            openAddClassifiersDialog={classifiers.openAddClassifiersDialog}
            openRemoveClassifierDialog={classifiers.openRemoveClassifierDialog}
            removeClassifierLoading={classifiers.removeClassifierLoading}
            classifierToRemove={classifiers.classifierToRemove}
          />
        </Box>
      </Box>

      <AddMatchDialog addMatch={addMatch} tournament={tournament} />
      <EditMatchDialog
        editMatch={editMatch}
        tournament={tournament}
        matches={matches}
        deleteMatchLoading={deleteMatchLoading}
        setMatchToDelete={setMatchToDelete}
        setDeleteMatchError={setDeleteMatchError}
      />

      <AddRefereePlanDialog
        addRefereePlan={addRefereePlan}
        tournament={tournament}
        personDisplayName={getPersonDisplayName}
      />
      <EditRefereePlanDialog
        editRefereePlan={editRefereePlan}
        tournament={tournament}
        matches={matches}
        deleteMatchLoading={deleteMatchLoading}
        setMatchToDelete={setMatchToDelete}
        setDeleteMatchError={setDeleteMatchError}
        personDisplayName={getPersonDisplayName}
      />

      <SelectionDialog
        open={teams.addTeamsOpen}
        title="Dodaj drużyny"
        items={teams.availableTeams.map((team) => ({ id: team.id, label: team.name }))}
        selectedIds={teams.selectedTeamIds}
        toggleSelected={teams.toggleSelectedTeam}
        onClose={teams.closeAddTeamsDialog}
        onSave={teams.saveSelectedTeams}
        loading={teams.saveTeamsLoading}
        availableLoading={teams.availableTeamsLoading}
        availableError={teams.availableTeamsError}
        saveError={teams.saveTeamsError}
        emptyState={
          teams.availableTeams.length === 0 && !teams.availableTeamsError ? (
            <Typography color="textSecondary" sx={{ py: 1 }}>
              Brak dostępnych drużyn w tym sezonie.
            </Typography>
          ) : undefined
        }
      />

      <ConfirmationDialog
        open={Boolean(matchToDelete)}
        title="Usunąć mecz?"
        description={
          matchToDelete ? (
            <Typography color="textSecondary">
              {tournament.teams.find((t) => t.id === matchToDelete.teamAId)?.name ?? matchToDelete.teamAId} vs{" "}
              {tournament.teams.find((t) => t.id === matchToDelete.teamBId)?.name ?? matchToDelete.teamBId}
            </Typography>
          ) : null
        }
        onClose={closeDeleteMatchDialog}
        onConfirm={confirmDeleteMatch}
        loading={deleteMatchLoading}
        errorMessage={deleteMatchError}
        confirmLabel="Usuń"
        cancelLabel="Anuluj"
      />

      <ConfirmationDialog
        open={Boolean(matchDayToDelete)}
        title="Usunąć dzień?"
        description={
          matchDayToDelete != null ? (
            <Typography color="textSecondary">{getScheduleDayLabel(matchDayToDelete)}</Typography>
          ) : null
        }
        onClose={closeDeleteMatchDayDialog}
        onConfirm={confirmDeleteMatchDay}
        loading={deleteMatchDayLoading}
        errorMessage={deleteMatchDayError}
        confirmLabel="Usuń"
        cancelLabel="Anuluj"
      />

      <ConfirmationDialog
        open={Boolean(teams.teamToRemove)}
        title="Usunąć drużynę z turnieju?"
        description={
          teams.teamToRemove ? (
            <Typography color="textSecondary">
              Drużyna: <strong>{teams.teamToRemove.name}</strong>
            </Typography>
          ) : null
        }
        onClose={teams.closeRemoveTeamDialog}
        onConfirm={teams.confirmRemoveTeam}
        loading={teams.removeTeamLoading}
        errorMessage={teams.removeTeamError}
        confirmLabel="Usuń"
        cancelLabel="Anuluj"
      />

      <SelectionDialog
        open={referees.addRefereesOpen}
        title="Dodaj sędziów"
        items={referees.availableReferees.map((referee) => ({
          id: referee.id,
          label: getPersonDisplayName(referee),
        }))}
        selectedIds={referees.selectedRefereeIds}
        toggleSelected={referees.toggleSelectedReferee}
        onClose={referees.closeAddRefereesDialog}
        onSave={referees.saveSelectedReferees}
        loading={referees.saveRefereesLoading}
        availableLoading={referees.availableRefereesLoading}
        availableError={referees.availableRefereesError}
        saveError={referees.saveRefereesError}
        emptyState={
          referees.availableReferees.length === 0 && !referees.availableRefereesError ? (
            <Typography color="textSecondary" sx={{ py: 1 }}>
              Brak dostępnych sędziów w tym sezonie.
            </Typography>
          ) : undefined
        }
      />

      <ConfirmationDialog
        open={Boolean(referees.refereeToRemove)}
        title="Usunąć sędziego z turnieju?"
        description={
          referees.refereeToRemove ? (
            <Typography color="textSecondary">
              Sędzia: <strong>{getPersonDisplayName(referees.refereeToRemove)}</strong>
            </Typography>
          ) : null
        }
        onClose={referees.closeRemoveRefereeDialog}
        onConfirm={referees.confirmRemoveReferee}
        loading={referees.removeRefereeLoading}
        errorMessage={referees.removeRefereeError}
        confirmLabel="Usuń"
        cancelLabel="Anuluj"
      />

      <SelectionDialog
        open={classifiers.addClassifiersOpen}
        title="Dodaj klasyfikatorów"
        items={classifiers.availableClassifiers.map((classifier) => ({
          id: classifier.id,
          label: getPersonDisplayName(classifier),
        }))}
        selectedIds={classifiers.selectedClassifierIds}
        toggleSelected={classifiers.toggleSelectedClassifier}
        onClose={classifiers.closeAddClassifiersDialog}
        onSave={classifiers.saveSelectedClassifiers}
        loading={classifiers.saveClassifiersLoading}
        availableLoading={classifiers.availableClassifiersLoading}
        availableError={classifiers.availableClassifiersError}
        saveError={classifiers.saveClassifiersError}
        emptyState={
          classifiers.availableClassifiers.length === 0 && !classifiers.availableClassifiersError ? (
            <Typography color="textSecondary" sx={{ py: 1 }}>
              Brak dostępnych klasyfikatorów w tym sezonie.
            </Typography>
          ) : undefined
        }
      />

      <ConfirmationDialog
        open={Boolean(classifiers.classifierToRemove)}
        title="Usunąć klasyfikatora z turnieju?"
        description={
          classifiers.classifierToRemove ? (
            <Typography color="textSecondary">
              Klasyfikator: <strong>{getPersonDisplayName(classifiers.classifierToRemove)}</strong>
            </Typography>
          ) : null
        }
        onClose={classifiers.closeRemoveClassifierDialog}
        onConfirm={classifiers.confirmRemoveClassifier}
        loading={classifiers.removeClassifierLoading}
        errorMessage={classifiers.removeClassifierError}
        confirmLabel="Usuń"
        cancelLabel="Anuluj"
      />
    </Box>
  );
}
