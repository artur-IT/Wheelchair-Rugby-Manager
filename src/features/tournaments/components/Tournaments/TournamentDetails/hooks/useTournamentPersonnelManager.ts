import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  removeClassifierFromTournament,
  removeRefereeFromTournament,
  removeTeamFromTournament,
  setTournamentClassifiers,
  setTournamentReferees,
  setTournamentTeams,
} from "@/lib/api/tournaments";
import { fetchTeamsBySeason } from "@/lib/api/teams";
import { fetchPersonnelBySeason } from "@/lib/api/personnel";
import { queryKeys } from "@/lib/queryKeys";
import type { Person, Team, Tournament } from "@/types";

interface UseTournamentPersonnelManagerArgs {
  tournament: Tournament | null;
}

interface TeamsSection {
  addTeamsOpen: boolean;
  availableTeams: Team[];
  availableTeamsLoading: boolean;
  availableTeamsError: string | null;
  selectedTeamIds: string[];
  saveTeamsLoading: boolean;
  saveTeamsError: string | null;
  teamToRemove: Team | null;
  removeTeamLoading: boolean;
  removeTeamError: string | null;
  openAddTeamsDialog: () => void;
  closeAddTeamsDialog: () => void;
  toggleSelectedTeam: (teamId: string) => void;
  saveSelectedTeams: () => Promise<void>;
  openRemoveTeamDialog: (team: Team) => void;
  closeRemoveTeamDialog: () => void;
  confirmRemoveTeam: () => Promise<void>;
}

interface RefereesSection {
  addRefereesOpen: boolean;
  availableReferees: Person[];
  availableRefereesLoading: boolean;
  availableRefereesError: string | null;
  selectedRefereeIds: string[];
  saveRefereesLoading: boolean;
  saveRefereesError: string | null;
  refereeToRemove: Person | null;
  removeRefereeLoading: boolean;
  removeRefereeError: string | null;
  openAddRefereesDialog: () => void;
  closeAddRefereesDialog: () => void;
  toggleSelectedReferee: (refereeId: string) => void;
  saveSelectedReferees: () => Promise<void>;
  openRemoveRefereeDialog: (person: Person) => void;
  closeRemoveRefereeDialog: () => void;
  confirmRemoveReferee: () => Promise<void>;
}

interface ClassifiersSection {
  addClassifiersOpen: boolean;
  availableClassifiers: Person[];
  availableClassifiersLoading: boolean;
  availableClassifiersError: string | null;
  selectedClassifierIds: string[];
  saveClassifiersLoading: boolean;
  saveClassifiersError: string | null;
  classifierToRemove: Person | null;
  removeClassifierLoading: boolean;
  removeClassifierError: string | null;
  openAddClassifiersDialog: () => void;
  closeAddClassifiersDialog: () => void;
  toggleSelectedClassifier: (classifierId: string) => void;
  saveSelectedClassifiers: () => Promise<void>;
  openRemoveClassifierDialog: (person: Person) => void;
  closeRemoveClassifierDialog: () => void;
  confirmRemoveClassifier: () => Promise<void>;
}

export default function useTournamentPersonnelManager({ tournament }: UseTournamentPersonnelManagerArgs) {
  const queryClient = useQueryClient();
  const seasonId = tournament?.seasonId;

  const [addTeamsOpen, setAddTeamsOpen] = useState(false);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [saveTeamsError, setSaveTeamsError] = useState<string | null>(null);
  const [teamToRemove, setTeamToRemove] = useState<Team | null>(null);
  const [removeTeamError, setRemoveTeamError] = useState<string | null>(null);

  const {
    data: availableTeams = [],
    isPending: availableTeamsLoading,
    isError: teamsQueryError,
    error: teamsErr,
  } = useQuery({
    queryKey: queryKeys.teams.bySeason(seasonId ?? "__none__"),
    queryFn: ({ signal }) => {
      if (!seasonId) return Promise.reject(new Error("Missing season"));
      return fetchTeamsBySeason(seasonId, signal);
    },
    enabled: Boolean(seasonId && addTeamsOpen),
  });

  const availableTeamsError = teamsQueryError && teamsErr instanceof Error ? teamsErr.message : null;

  const saveTeamsMutation = useMutation({
    mutationFn: ({ tournamentId, teamIds }: { tournamentId: string; teamIds: string[] }) =>
      setTournamentTeams(tournamentId, teamIds),
    onSuccess: (_, { tournamentId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.detail(tournamentId) });
    },
  });

  const removeTeamMutation = useMutation({
    mutationFn: ({ tournamentId, teamId }: { tournamentId: string; teamId: string }) =>
      removeTeamFromTournament(tournamentId, teamId),
    onSuccess: (_, { tournamentId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.detail(tournamentId) });
    },
  });

  const [addRefereesOpen, setAddRefereesOpen] = useState(false);
  const [selectedRefereeIds, setSelectedRefereeIds] = useState<string[]>([]);
  const [saveRefereesError, setSaveRefereesError] = useState<string | null>(null);
  const [refereeToRemove, setRefereeToRemove] = useState<Person | null>(null);
  const [removeRefereeError, setRemoveRefereeError] = useState<string | null>(null);

  const {
    data: availableReferees = [],
    isPending: availableRefereesLoading,
    isError: refereesQueryError,
    error: refereesErr,
  } = useQuery({
    queryKey: queryKeys.referees.bySeason(seasonId ?? "__none__"),
    queryFn: ({ signal }) => {
      if (!seasonId) return Promise.reject(new Error("Missing season"));
      return fetchPersonnelBySeason("/api/referees", seasonId, "Nie udało się pobrać sędziów", signal);
    },
    enabled: Boolean(seasonId && addRefereesOpen),
  });

  const availableRefereesError = refereesQueryError && refereesErr instanceof Error ? refereesErr.message : null;

  const saveRefereesMutation = useMutation({
    mutationFn: ({ tournamentId, refereeIds }: { tournamentId: string; refereeIds: string[] }) =>
      setTournamentReferees(tournamentId, refereeIds),
    onSuccess: (_, { tournamentId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.detail(tournamentId) });
    },
  });

  const removeRefereeMutation = useMutation({
    mutationFn: ({ tournamentId, refereeId }: { tournamentId: string; refereeId: string }) =>
      removeRefereeFromTournament(tournamentId, refereeId),
    onSuccess: (_, { tournamentId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.detail(tournamentId) });
    },
  });

  const [addClassifiersOpen, setAddClassifiersOpen] = useState(false);
  const [selectedClassifierIds, setSelectedClassifierIds] = useState<string[]>([]);
  const [saveClassifiersError, setSaveClassifiersError] = useState<string | null>(null);
  const [classifierToRemove, setClassifierToRemove] = useState<Person | null>(null);
  const [removeClassifierError, setRemoveClassifierError] = useState<string | null>(null);

  const {
    data: availableClassifiers = [],
    isPending: availableClassifiersLoading,
    isError: classifiersQueryError,
    error: classifiersErr,
  } = useQuery({
    queryKey: queryKeys.classifiers.bySeason(seasonId ?? "__none__"),
    queryFn: ({ signal }) => {
      if (!seasonId) return Promise.reject(new Error("Missing season"));
      return fetchPersonnelBySeason("/api/classifiers", seasonId, "Nie udało się pobrać klasyfikatorów", signal);
    },
    enabled: Boolean(seasonId && addClassifiersOpen),
  });

  const availableClassifiersError =
    classifiersQueryError && classifiersErr instanceof Error ? classifiersErr.message : null;

  const saveClassifiersMutation = useMutation({
    mutationFn: ({ tournamentId, classifierIds }: { tournamentId: string; classifierIds: string[] }) =>
      setTournamentClassifiers(tournamentId, classifierIds),
    onSuccess: (_, { tournamentId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.detail(tournamentId) });
    },
  });

  const removeClassifierMutation = useMutation({
    mutationFn: ({ tournamentId, classifierId }: { tournamentId: string; classifierId: string }) =>
      removeClassifierFromTournament(tournamentId, classifierId),
    onSuccess: (_, { tournamentId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.detail(tournamentId) });
    },
  });

  function openAddTeamsDialog() {
    if (!tournament) return;
    setAddTeamsOpen(true);
    setSaveTeamsError(null);
    setSelectedTeamIds(tournament.teams.map((t) => t.id));
  }

  function closeAddTeamsDialog() {
    if (saveTeamsMutation.isPending) return;
    setAddTeamsOpen(false);
    setSaveTeamsError(null);
  }

  function toggleSelectedTeam(teamId: string) {
    setSelectedTeamIds((prev) => (prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]));
  }

  async function saveSelectedTeams() {
    if (!tournament) return;
    if (selectedTeamIds.length === 0) {
      setSaveTeamsError("Wybierz przynajmniej jedną drużynę");
      return;
    }

    setSaveTeamsError(null);
    try {
      await saveTeamsMutation.mutateAsync({ tournamentId: tournament.id, teamIds: selectedTeamIds });
      setAddTeamsOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się dodać drużyn";
      setSaveTeamsError(message);
    }
  }

  function openRemoveTeamDialog(team: Team) {
    setRemoveTeamError(null);
    setTeamToRemove(team);
  }

  function closeRemoveTeamDialog() {
    if (removeTeamMutation.isPending) return;
    setTeamToRemove(null);
    setRemoveTeamError(null);
  }

  async function confirmRemoveTeam() {
    if (!tournament || !teamToRemove) return;

    setRemoveTeamError(null);
    try {
      await removeTeamMutation.mutateAsync({ tournamentId: tournament.id, teamId: teamToRemove.id });
      setTeamToRemove(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się usunąć drużyny z turnieju";
      setRemoveTeamError(message);
    }
  }

  function openAddRefereesDialog() {
    if (!tournament) return;
    setAddRefereesOpen(true);
    setSaveRefereesError(null);
    setSelectedRefereeIds(tournament.referees.map((r) => r.id));
  }

  function closeAddRefereesDialog() {
    if (saveRefereesMutation.isPending) return;
    setAddRefereesOpen(false);
    setSaveRefereesError(null);
  }

  function toggleSelectedReferee(refereeId: string) {
    setSelectedRefereeIds((prev) =>
      prev.includes(refereeId) ? prev.filter((id) => id !== refereeId) : [...prev, refereeId]
    );
  }

  async function saveSelectedReferees() {
    if (!tournament) return;
    if (selectedRefereeIds.length === 0) {
      setSaveRefereesError("Wybierz przynajmniej jednego sędziego");
      return;
    }

    setSaveRefereesError(null);
    try {
      await saveRefereesMutation.mutateAsync({ tournamentId: tournament.id, refereeIds: selectedRefereeIds });
      setAddRefereesOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się dodać sędziów";
      setSaveRefereesError(message);
    }
  }

  function openRemoveRefereeDialog(person: Person) {
    setRemoveRefereeError(null);
    setRefereeToRemove(person);
  }

  function closeRemoveRefereeDialog() {
    if (removeRefereeMutation.isPending) return;
    setRefereeToRemove(null);
    setRemoveRefereeError(null);
  }

  async function confirmRemoveReferee() {
    if (!tournament || !refereeToRemove) return;
    setRemoveRefereeError(null);
    try {
      await removeRefereeMutation.mutateAsync({ tournamentId: tournament.id, refereeId: refereeToRemove.id });
      setRefereeToRemove(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się usunąć sędziego z turnieju";
      setRemoveRefereeError(message);
    }
  }

  function openAddClassifiersDialog() {
    if (!tournament) return;
    setAddClassifiersOpen(true);
    setSaveClassifiersError(null);
    setSelectedClassifierIds(tournament.classifiers.map((c) => c.id));
  }

  function closeAddClassifiersDialog() {
    if (saveClassifiersMutation.isPending) return;
    setAddClassifiersOpen(false);
    setSaveClassifiersError(null);
  }

  function toggleSelectedClassifier(classifierId: string) {
    setSelectedClassifierIds((prev) =>
      prev.includes(classifierId) ? prev.filter((id) => id !== classifierId) : [...prev, classifierId]
    );
  }

  async function saveSelectedClassifiers() {
    if (!tournament) return;
    if (selectedClassifierIds.length === 0) {
      setSaveClassifiersError("Wybierz przynajmniej jednego klasyfikatora");
      return;
    }

    setSaveClassifiersError(null);
    try {
      await saveClassifiersMutation.mutateAsync({
        tournamentId: tournament.id,
        classifierIds: selectedClassifierIds,
      });
      setAddClassifiersOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się dodać klasyfikatorów";
      setSaveClassifiersError(message);
    }
  }

  function openRemoveClassifierDialog(person: Person) {
    setRemoveClassifierError(null);
    setClassifierToRemove(person);
  }

  function closeRemoveClassifierDialog() {
    if (removeClassifierMutation.isPending) return;
    setClassifierToRemove(null);
    setRemoveClassifierError(null);
  }

  async function confirmRemoveClassifier() {
    if (!tournament || !classifierToRemove) return;
    setRemoveClassifierError(null);
    try {
      await removeClassifierMutation.mutateAsync({
        tournamentId: tournament.id,
        classifierId: classifierToRemove.id,
      });
      setClassifierToRemove(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się usunąć klasyfikatora z turnieju";
      setRemoveClassifierError(message);
    }
  }

  const teams: TeamsSection = {
    addTeamsOpen,
    availableTeams,
    availableTeamsLoading,
    availableTeamsError,
    selectedTeamIds,
    saveTeamsLoading: saveTeamsMutation.isPending,
    saveTeamsError,
    teamToRemove,
    removeTeamLoading: removeTeamMutation.isPending,
    removeTeamError,
    openAddTeamsDialog,
    closeAddTeamsDialog,
    toggleSelectedTeam,
    saveSelectedTeams,
    openRemoveTeamDialog,
    closeRemoveTeamDialog,
    confirmRemoveTeam,
  };

  const referees: RefereesSection = {
    addRefereesOpen,
    availableReferees,
    availableRefereesLoading,
    availableRefereesError,
    selectedRefereeIds,
    saveRefereesLoading: saveRefereesMutation.isPending,
    saveRefereesError,
    refereeToRemove,
    removeRefereeLoading: removeRefereeMutation.isPending,
    removeRefereeError,
    openAddRefereesDialog,
    closeAddRefereesDialog,
    toggleSelectedReferee,
    saveSelectedReferees,
    openRemoveRefereeDialog,
    closeRemoveRefereeDialog,
    confirmRemoveReferee,
  };

  const classifiers: ClassifiersSection = {
    addClassifiersOpen,
    availableClassifiers,
    availableClassifiersLoading,
    availableClassifiersError,
    selectedClassifierIds,
    saveClassifiersLoading: saveClassifiersMutation.isPending,
    saveClassifiersError,
    classifierToRemove,
    removeClassifierLoading: removeClassifierMutation.isPending,
    removeClassifierError,
    openAddClassifiersDialog,
    closeAddClassifiersDialog,
    toggleSelectedClassifier,
    saveSelectedClassifiers,
    openRemoveClassifierDialog,
    closeRemoveClassifierDialog,
    confirmRemoveClassifier,
  };

  return { teams, referees, classifiers };
}
