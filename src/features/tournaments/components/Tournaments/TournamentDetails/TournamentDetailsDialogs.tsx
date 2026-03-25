import { Typography } from "@mui/material";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import SelectionDialog from "@/features/tournaments/components/Tournaments/TournamentDetails/SelectionDialog";
import useTournamentPersonnelManager from "@/features/tournaments/components/Tournaments/TournamentDetails/hooks/useTournamentPersonnelManager";
import type { Match, Person, Tournament } from "@/types";

interface TournamentDetailsDialogsProps {
  tournament: Tournament;
  matchToDelete: Match | null;
  matchDayToDelete: number | null;
  classifierDayToDelete: number | null;
  deleteMatchLoading: boolean;
  deleteMatchError: string | null;
  deleteMatchDayLoading: boolean;
  deleteMatchDayError: string | null;
  deleteClassifierDayLoading: boolean;
  deleteClassifierDayError: string | null;
  getScheduleDayLabel: (timestamp: number) => string;
  closeDeleteMatchDialog: () => void;
  confirmDeleteMatch: () => void;
  closeDeleteMatchDayDialog: () => void;
  confirmDeleteMatchDay: () => void;
  closeDeleteClassifierDayDialog: () => void;
  confirmDeleteClassifierDay: () => void;
  teams: ReturnType<typeof useTournamentPersonnelManager>["teams"];
  referees: ReturnType<typeof useTournamentPersonnelManager>["referees"];
  classifiers: ReturnType<typeof useTournamentPersonnelManager>["classifiers"];
  getPersonDisplayName: (person: Person) => string;
}

export default function TournamentDetailsDialogs({
  tournament,
  matchToDelete,
  matchDayToDelete,
  classifierDayToDelete,
  deleteMatchLoading,
  deleteMatchError,
  deleteMatchDayLoading,
  deleteMatchDayError,
  deleteClassifierDayLoading,
  deleteClassifierDayError,
  getScheduleDayLabel,
  closeDeleteMatchDialog,
  confirmDeleteMatch,
  closeDeleteMatchDayDialog,
  confirmDeleteMatchDay,
  closeDeleteClassifierDayDialog,
  confirmDeleteClassifierDay,
  teams,
  referees,
  classifiers,
  getPersonDisplayName,
}: TournamentDetailsDialogsProps) {
  return (
    <>
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
        open={Boolean(classifierDayToDelete)}
        title="Usunąć dzień planu klasyfikatorów?"
        description={
          classifierDayToDelete != null ? (
            <Typography color="textSecondary">{getScheduleDayLabel(classifierDayToDelete)}</Typography>
          ) : null
        }
        onClose={closeDeleteClassifierDayDialog}
        onConfirm={confirmDeleteClassifierDay}
        loading={deleteClassifierDayLoading}
        errorMessage={deleteClassifierDayError}
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
    </>
  );
}
