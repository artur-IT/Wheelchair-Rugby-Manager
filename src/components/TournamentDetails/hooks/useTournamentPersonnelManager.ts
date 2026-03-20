import { useState } from "react";
import type { Person, Team, Tournament } from "@/types";

interface UseTournamentPersonnelManagerArgs {
  tournament: Tournament | null;
  refreshTournament: (tournamentId: string) => Promise<void>;
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

export default function useTournamentPersonnelManager({
  tournament,
  refreshTournament,
}: UseTournamentPersonnelManagerArgs) {
  // Teams dialog state
  const [addTeamsOpen, setAddTeamsOpen] = useState(false);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [availableTeamsLoading, setAvailableTeamsLoading] = useState(false);
  const [availableTeamsError, setAvailableTeamsError] = useState<string | null>(null);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [saveTeamsLoading, setSaveTeamsLoading] = useState(false);
  const [saveTeamsError, setSaveTeamsError] = useState<string | null>(null);
  const [teamToRemove, setTeamToRemove] = useState<Team | null>(null);
  const [removeTeamLoading, setRemoveTeamLoading] = useState(false);
  const [removeTeamError, setRemoveTeamError] = useState<string | null>(null);

  function openAddTeamsDialog() {
    if (!tournament) return;
    setAddTeamsOpen(true);
    setAvailableTeamsError(null);
    setSaveTeamsError(null);
    setSelectedTeamIds(tournament.teams.map((t) => t.id));

    if (availableTeamsLoading) return;
    if (availableTeams.length > 0) return;

    setAvailableTeamsLoading(true);
    fetch(`/api/teams?seasonId=${encodeURIComponent(tournament.seasonId)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Nie udało się pobrać drużyn");
        return res.json();
      })
      .then((teams: Team[]) => setAvailableTeams(teams))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Nie udało się pobrać drużyn";
        setAvailableTeamsError(message);
      })
      .finally(() => setAvailableTeamsLoading(false));
  }

  function closeAddTeamsDialog() {
    if (saveTeamsLoading) return;
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

    setSaveTeamsLoading(true);
    setSaveTeamsError(null);
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamIds: selectedTeamIds }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Nie udało się dodać drużyn");
      }

      await refreshTournament(tournament.id);
      setAddTeamsOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się dodać drużyn";
      setSaveTeamsError(message);
    } finally {
      setSaveTeamsLoading(false);
    }
  }

  function openRemoveTeamDialog(team: Team) {
    setRemoveTeamError(null);
    setTeamToRemove(team);
  }

  function closeRemoveTeamDialog() {
    if (removeTeamLoading) return;
    setTeamToRemove(null);
    setRemoveTeamError(null);
  }

  async function confirmRemoveTeam() {
    if (!tournament || !teamToRemove) return;

    setRemoveTeamLoading(true);
    setRemoveTeamError(null);
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/teams/${teamToRemove.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Nie udało się usunąć drużyny z turnieju");
      }

      await refreshTournament(tournament.id);
      setTeamToRemove(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się usunąć drużyny z turnieju";
      setRemoveTeamError(message);
    } finally {
      setRemoveTeamLoading(false);
    }
  }

  // Referee dialog state
  const [addRefereesOpen, setAddRefereesOpen] = useState(false);
  const [availableReferees, setAvailableReferees] = useState<Person[]>([]);
  const [availableRefereesLoading, setAvailableRefereesLoading] = useState(false);
  const [availableRefereesError, setAvailableRefereesError] = useState<string | null>(null);
  const [selectedRefereeIds, setSelectedRefereeIds] = useState<string[]>([]);
  const [saveRefereesLoading, setSaveRefereesLoading] = useState(false);
  const [saveRefereesError, setSaveRefereesError] = useState<string | null>(null);
  const [refereeToRemove, setRefereeToRemove] = useState<Person | null>(null);
  const [removeRefereeLoading, setRemoveRefereeLoading] = useState(false);
  const [removeRefereeError, setRemoveRefereeError] = useState<string | null>(null);

  function openAddRefereesDialog() {
    if (!tournament) return;
    setAddRefereesOpen(true);
    setAvailableRefereesError(null);
    setSaveRefereesError(null);
    setSelectedRefereeIds(tournament.referees.map((r) => r.id));
    if (availableRefereesLoading || availableReferees.length > 0) return;

    setAvailableRefereesLoading(true);
    fetch(`/api/referees?seasonId=${encodeURIComponent(tournament.seasonId)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Nie udało się pobrać sędziów");
        return res.json();
      })
      .then((list: Person[]) => setAvailableReferees(list))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Nie udało się pobrać sędziów";
        setAvailableRefereesError(message);
      })
      .finally(() => setAvailableRefereesLoading(false));
  }

  function closeAddRefereesDialog() {
    if (saveRefereesLoading) return;
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

    setSaveRefereesLoading(true);
    setSaveRefereesError(null);
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/referees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refereeIds: selectedRefereeIds }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Nie udało się dodać sędziów");
      }

      await refreshTournament(tournament.id);
      setAddRefereesOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się dodać sędziów";
      setSaveRefereesError(message);
    } finally {
      setSaveRefereesLoading(false);
    }
  }

  function openRemoveRefereeDialog(person: Person) {
    setRemoveRefereeError(null);
    setRefereeToRemove(person);
  }

  function closeRemoveRefereeDialog() {
    if (removeRefereeLoading) return;
    setRefereeToRemove(null);
    setRemoveRefereeError(null);
  }

  async function confirmRemoveReferee() {
    if (!tournament || !refereeToRemove) return;
    setRemoveRefereeLoading(true);
    setRemoveRefereeError(null);
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/referees/${refereeToRemove.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Nie udało się usunąć sędziego z turnieju");
      }

      await refreshTournament(tournament.id);
      setRefereeToRemove(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się usunąć sędziego z turnieju";
      setRemoveRefereeError(message);
    } finally {
      setRemoveRefereeLoading(false);
    }
  }

  // Classifier dialog state
  const [addClassifiersOpen, setAddClassifiersOpen] = useState(false);
  const [availableClassifiers, setAvailableClassifiers] = useState<Person[]>([]);
  const [availableClassifiersLoading, setAvailableClassifiersLoading] = useState(false);
  const [availableClassifiersError, setAvailableClassifiersError] = useState<string | null>(null);
  const [selectedClassifierIds, setSelectedClassifierIds] = useState<string[]>([]);
  const [saveClassifiersLoading, setSaveClassifiersLoading] = useState(false);
  const [saveClassifiersError, setSaveClassifiersError] = useState<string | null>(null);
  const [classifierToRemove, setClassifierToRemove] = useState<Person | null>(null);
  const [removeClassifierLoading, setRemoveClassifierLoading] = useState(false);
  const [removeClassifierError, setRemoveClassifierError] = useState<string | null>(null);

  function openAddClassifiersDialog() {
    if (!tournament) return;
    setAddClassifiersOpen(true);
    setAvailableClassifiersError(null);
    setSaveClassifiersError(null);
    setSelectedClassifierIds(tournament.classifiers.map((c) => c.id));
    if (availableClassifiersLoading || availableClassifiers.length > 0) return;

    setAvailableClassifiersLoading(true);
    fetch(`/api/classifiers?seasonId=${encodeURIComponent(tournament.seasonId)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Nie udało się pobrać klasyfikatorów");
        return res.json();
      })
      .then((list: Person[]) => setAvailableClassifiers(list))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Nie udało się pobrać klasyfikatorów";
        setAvailableClassifiersError(message);
      })
      .finally(() => setAvailableClassifiersLoading(false));
  }

  function closeAddClassifiersDialog() {
    if (saveClassifiersLoading) return;
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

    setSaveClassifiersLoading(true);
    setSaveClassifiersError(null);
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/classifiers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classifierIds: selectedClassifierIds }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Nie udało się dodać klasyfikatorów");
      }

      await refreshTournament(tournament.id);
      setAddClassifiersOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się dodać klasyfikatorów";
      setSaveClassifiersError(message);
    } finally {
      setSaveClassifiersLoading(false);
    }
  }

  function openRemoveClassifierDialog(person: Person) {
    setRemoveClassifierError(null);
    setClassifierToRemove(person);
  }

  function closeRemoveClassifierDialog() {
    if (removeClassifierLoading) return;
    setClassifierToRemove(null);
    setRemoveClassifierError(null);
  }

  async function confirmRemoveClassifier() {
    if (!tournament || !classifierToRemove) return;
    setRemoveClassifierLoading(true);
    setRemoveClassifierError(null);
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/classifiers/${classifierToRemove.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Nie udało się usunąć klasyfikatora z turnieju");
      }

      await refreshTournament(tournament.id);
      setClassifierToRemove(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się usunąć klasyfikatora z turnieju";
      setRemoveClassifierError(message);
    } finally {
      setRemoveClassifierLoading(false);
    }
  }

  const teams: TeamsSection = {
    addTeamsOpen,
    availableTeams,
    availableTeamsLoading,
    availableTeamsError,
    selectedTeamIds,
    saveTeamsLoading,
    saveTeamsError,
    teamToRemove,
    removeTeamLoading,
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
    saveRefereesLoading,
    saveRefereesError,
    refereeToRemove,
    removeRefereeLoading,
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
    saveClassifiersLoading,
    saveClassifiersError,
    classifierToRemove,
    removeClassifierLoading,
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
