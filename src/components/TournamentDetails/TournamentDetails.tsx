import { useEffect, useState } from "react";
import { MapPin, Trash2 } from "lucide-react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Link as MuiLink,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  IconButton,
  Tooltip,
} from "@mui/material";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import AppShell from "@/components/AppShell/AppShell";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import type { Person, Team, Tournament } from "@/types";

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
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    const controller = new AbortController();

    async function loadTournament() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/tournaments/${id}`, { signal: controller.signal });
        if (res.status === 404) {
          setTournament(null);
          return;
        }
        if (!res.ok) {
          throw new Error("Nie udało się pobrać turnieju");
        }

        const data: Tournament = await res.json();
        setTournament(data);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Wystąpił błąd podczas pobierania turnieju");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadTournament();
    return () => controller.abort();
  }, [id]);

  async function refreshTournament(nextTournamentId: string) {
    const refreshed = await fetch(`/api/tournaments/${nextTournamentId}`);
    if (refreshed.status === 404) {
      setTournament(null);
      return;
    }
    if (!refreshed.ok) throw new Error("Nie udało się odświeżyć turnieju");
    const updated: Tournament = await refreshed.json();
    setTournament(updated);
  }

  async function openAddTeamsDialog() {
    if (!tournament) return;

    setAddTeamsOpen(true);
    setAvailableTeamsError(null);
    setSaveTeamsError(null);
    setSelectedTeamIds([]);

    if (availableTeamsLoading) return;
    if (availableTeams.length > 0) return;

    setAvailableTeamsLoading(true);
    try {
      const res = await fetch(`/api/teams?seasonId=${encodeURIComponent(tournament.seasonId)}`);
      if (!res.ok) throw new Error("Nie udało się pobrać drużyn");
      const teams: Team[] = await res.json();
      setAvailableTeams(teams);
    } catch (e) {
      setAvailableTeamsError(e instanceof Error ? e.message : "Nie udało się pobrać drużyn");
    } finally {
      setAvailableTeamsLoading(false);
    }
  }

  function closeAddTeamsDialog() {
    if (saveTeamsLoading) return;
    setAddTeamsOpen(false);
    setSaveTeamsError(null);
  }

  function toggleSelected(teamId: string) {
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
    } catch (e) {
      setSaveTeamsError(e instanceof Error ? e.message : "Nie udało się dodać drużyn");
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
    } catch (e) {
      setRemoveTeamError(e instanceof Error ? e.message : "Nie udało się usunąć drużyny z turnieju");
    } finally {
      setRemoveTeamLoading(false);
    }
  }

  async function openAddRefereesDialog() {
    if (!tournament) return;
    setAddRefereesOpen(true);
    setAvailableRefereesError(null);
    setSaveRefereesError(null);
    setSelectedRefereeIds(tournament.referees.map((r) => r.id));
    if (availableRefereesLoading || availableReferees.length > 0) return;
    setAvailableRefereesLoading(true);
    try {
      const res = await fetch(`/api/referees?seasonId=${encodeURIComponent(tournament.seasonId)}`);
      if (!res.ok) throw new Error("Nie udało się pobrać sędziów");
      const list: Person[] = await res.json();
      setAvailableReferees(list);
    } catch (e) {
      setAvailableRefereesError(e instanceof Error ? e.message : "Nie udało się pobrać sędziów");
    } finally {
      setAvailableRefereesLoading(false);
    }
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
    } catch (e) {
      setSaveRefereesError(e instanceof Error ? e.message : "Nie udało się dodać sędziów");
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
    } catch (e) {
      setRemoveRefereeError(e instanceof Error ? e.message : "Nie udało się usunąć sędziego z turnieju");
    } finally {
      setRemoveRefereeLoading(false);
    }
  }

  async function openAddClassifiersDialog() {
    if (!tournament) return;
    setAddClassifiersOpen(true);
    setAvailableClassifiersError(null);
    setSaveClassifiersError(null);
    setSelectedClassifierIds(tournament.classifiers.map((c) => c.id));
    if (availableClassifiersLoading || availableClassifiers.length > 0) return;
    setAvailableClassifiersLoading(true);
    try {
      const res = await fetch(`/api/classifiers?seasonId=${encodeURIComponent(tournament.seasonId)}`);
      if (!res.ok) throw new Error("Nie udało się pobrać klasyfikatorów");
      const list: Person[] = await res.json();
      setAvailableClassifiers(list);
    } catch (e) {
      setAvailableClassifiersError(e instanceof Error ? e.message : "Nie udało się pobrać klasyfikatorów");
    } finally {
      setAvailableClassifiersLoading(false);
    }
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
    } catch (e) {
      setSaveClassifiersError(e instanceof Error ? e.message : "Nie udało się dodać klasyfikatorów");
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
    } catch (e) {
      setRemoveClassifierError(e instanceof Error ? e.message : "Nie udało się usunąć klasyfikatora z turnieju");
    } finally {
      setRemoveClassifierLoading(false);
    }
  }

  const personDisplayName = (p: Person) => `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || "—";

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

  const venue = tournament.venue;
  const accommodation = tournament.accommodation;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Box>
          <MuiLink
            href="/tournaments"
            underline="hover"
            sx={{
              color: "primary.main",
              fontWeight: 600,
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              mb: 1,
            }}
          >
            &larr; Powrót do listy
          </MuiLink>
          <Typography variant="h3" sx={{ fontWeight: 900 }}>
            {tournament.name}
          </Typography>
          <Typography color="textSecondary">{formatDateRange(tournament.startDate, tournament.endDate)}</Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button variant="outlined" sx={{ borderRadius: 4, fontWeight: "bold" }}>
            Wyczyść dane
          </Button>
          <Button
            component="a"
            href={`/tournaments/${id}/edit`}
            variant="contained"
            sx={{ borderRadius: 4, fontWeight: "bold" }}
          >
            Edytuj turniej
          </Button>
        </Box>
      </Box>

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

          <Paper sx={{ p: 4, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3 }}>
              Plan Rozgrywek
            </Typography>
            <Box
              sx={{
                color: "text.secondary",
                fontStyle: "italic",
                textAlign: "center",
                py: 5,
                border: "2px dashed",
                borderColor: "grey.200",
                borderRadius: 2,
              }}
            >
              Brak zaplanowanych meczów. Dodaj mecze w edycji turnieju.
            </Box>
          </Paper>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
              Drużyny
            </Typography>
            {tournament.teams.length === 0 ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Typography variant="body2" color="textSecondary">
                  Brak przypisanych drużyn.
                </Typography>
                <Button variant="contained" onClick={openAddTeamsDialog} sx={{ alignSelf: "flex-start" }}>
                  Dodaj
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {tournament.teams.map((team) => (
                  <Box
                    key={team.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: "grey.50",
                    }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: "white",
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: "grey.200",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        color: "primary.main",
                      }}
                    >
                      {team.name[0] ?? "?"}
                    </Box>
                    <Typography sx={{ fontWeight: 500, flex: 1 }}>{team.name}</Typography>
                    <Tooltip title="Usuń drużynę z turnieju">
                      <span>
                        <IconButton
                          aria-label={`Usuń drużynę ${team.name} z turnieju`}
                          color="error"
                          onClick={() => openRemoveTeamDialog(team)}
                          size="small"
                          disabled={removeTeamLoading && teamToRemove?.id === team.id}
                          sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
                        >
                          <Trash2 size={18} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
              Personel
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    color: "text.secondary",
                    mb: 1,
                    display: "block",
                  }}
                >
                  Sędziowie
                </Typography>
                {tournament.referees.length === 0 ? (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <Typography variant="body2" color="textSecondary">
                      Brak przypisanych sędziów.
                    </Typography>
                    <Button variant="contained" onClick={openAddRefereesDialog} sx={{ alignSelf: "flex-start" }}>
                      Dodaj
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {tournament.referees.map((r) => (
                      <Box
                        key={r.id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: "grey.50",
                        }}
                      >
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: "white",
                            borderRadius: 1,
                            border: "1px solid",
                            borderColor: "grey.200",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "bold",
                            color: "primary.main",
                          }}
                        >
                          {r.firstName?.[0] ?? "?"}
                        </Box>
                        <Typography sx={{ fontWeight: 500, flex: 1 }}>{personDisplayName(r)}</Typography>
                        <Tooltip title="Usuń sędziego z turnieju">
                          <span>
                            <IconButton
                              aria-label={`Usuń sędziego ${personDisplayName(r)} z turnieju`}
                              color="error"
                              onClick={() => openRemoveRefereeDialog(r)}
                              size="small"
                              disabled={removeRefereeLoading && refereeToRemove?.id === r.id}
                              sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
                            >
                              <Trash2 size={18} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    ))}
                    <Button variant="outlined" onClick={openAddRefereesDialog} sx={{ alignSelf: "flex-start" }}>
                      Dodaj
                    </Button>
                  </Box>
                )}
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    color: "text.secondary",
                    mb: 1,
                    display: "block",
                  }}
                >
                  Klasyfikatorzy
                </Typography>
                {tournament.classifiers.length === 0 ? (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <Typography variant="body2" color="textSecondary">
                      Brak przypisanych klasyfikatorów.
                    </Typography>
                    <Button variant="contained" onClick={openAddClassifiersDialog} sx={{ alignSelf: "flex-start" }}>
                      Dodaj
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {tournament.classifiers.map((c) => (
                      <Box
                        key={c.id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: "grey.50",
                        }}
                      >
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: "white",
                            borderRadius: 1,
                            border: "1px solid",
                            borderColor: "grey.200",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "bold",
                            color: "primary.main",
                          }}
                        >
                          {c.firstName?.[0] ?? "?"}
                        </Box>
                        <Typography sx={{ fontWeight: 500, flex: 1 }}>{personDisplayName(c)}</Typography>
                        <Tooltip title="Usuń klasyfikatora z turnieju">
                          <span>
                            <IconButton
                              aria-label={`Usuń klasyfikatora ${personDisplayName(c)} z turnieju`}
                              color="error"
                              onClick={() => openRemoveClassifierDialog(c)}
                              size="small"
                              disabled={removeClassifierLoading && classifierToRemove?.id === c.id}
                              sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
                            >
                              <Trash2 size={18} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    ))}
                    <Button variant="outlined" onClick={openAddClassifiersDialog} sx={{ alignSelf: "flex-start" }}>
                      Dodaj
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>

      <Dialog open={addTeamsOpen} onClose={closeAddTeamsDialog} fullWidth maxWidth="sm">
        <DialogTitle>Dodaj drużyny</DialogTitle>
        <DialogContent dividers>
          {availableTeamsError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {availableTeamsError}
            </Alert>
          ) : null}
          {saveTeamsError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {saveTeamsError}
            </Alert>
          ) : null}

          {availableTeamsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <List dense>
              {availableTeams.map((team) => {
                const checked = selectedTeamIds.includes(team.id);
                return (
                  <ListItemButton key={team.id} onClick={() => toggleSelected(team.id)}>
                    <ListItemIcon>
                      <Checkbox edge="start" checked={checked} tabIndex={-1} disableRipple />
                    </ListItemIcon>
                    <ListItemText primary={team.name} />
                  </ListItemButton>
                );
              })}
              {availableTeams.length === 0 && !availableTeamsError ? (
                <Typography color="textSecondary" sx={{ py: 1 }}>
                  Brak dostępnych drużyn w tym sezonie.
                </Typography>
              ) : null}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAddTeamsDialog} disabled={saveTeamsLoading}>
            Anuluj
          </Button>
          <Button variant="contained" onClick={saveSelectedTeams} disabled={saveTeamsLoading || availableTeamsLoading}>
            Dodaj
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmationDialog
        open={Boolean(teamToRemove)}
        title="Usunąć drużynę z turnieju?"
        description={
          teamToRemove ? (
            <Typography color="textSecondary">
              Drużyna: <strong>{teamToRemove.name}</strong>
            </Typography>
          ) : null
        }
        onClose={closeRemoveTeamDialog}
        onConfirm={confirmRemoveTeam}
        loading={removeTeamLoading}
        errorMessage={removeTeamError}
        confirmLabel="Usuń"
        cancelLabel="Anuluj"
      />

      <Dialog open={addRefereesOpen} onClose={closeAddRefereesDialog} fullWidth maxWidth="sm">
        <DialogTitle>Dodaj sędziów</DialogTitle>
        <DialogContent dividers>
          {availableRefereesError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {availableRefereesError}
            </Alert>
          ) : null}
          {saveRefereesError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {saveRefereesError}
            </Alert>
          ) : null}
          {availableRefereesLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <List dense>
              {availableReferees.map((referee) => {
                const checked = selectedRefereeIds.includes(referee.id);
                return (
                  <ListItemButton key={referee.id} onClick={() => toggleSelectedReferee(referee.id)}>
                    <ListItemIcon>
                      <Checkbox edge="start" checked={checked} tabIndex={-1} disableRipple />
                    </ListItemIcon>
                    <ListItemText primary={personDisplayName(referee)} />
                  </ListItemButton>
                );
              })}
              {availableReferees.length === 0 && !availableRefereesError ? (
                <Typography color="textSecondary" sx={{ py: 1 }}>
                  Brak dostępnych sędziów w tym sezonie.
                </Typography>
              ) : null}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAddRefereesDialog} disabled={saveRefereesLoading}>
            Anuluj
          </Button>
          <Button
            variant="contained"
            onClick={saveSelectedReferees}
            disabled={saveRefereesLoading || availableRefereesLoading}
          >
            Dodaj
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmationDialog
        open={Boolean(refereeToRemove)}
        title="Usunąć sędziego z turnieju?"
        description={
          refereeToRemove ? (
            <Typography color="textSecondary">
              Sędzia: <strong>{personDisplayName(refereeToRemove)}</strong>
            </Typography>
          ) : null
        }
        onClose={closeRemoveRefereeDialog}
        onConfirm={confirmRemoveReferee}
        loading={removeRefereeLoading}
        errorMessage={removeRefereeError}
        confirmLabel="Usuń"
        cancelLabel="Anuluj"
      />

      <Dialog open={addClassifiersOpen} onClose={closeAddClassifiersDialog} fullWidth maxWidth="sm">
        <DialogTitle>Dodaj klasyfikatorów</DialogTitle>
        <DialogContent dividers>
          {availableClassifiersError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {availableClassifiersError}
            </Alert>
          ) : null}
          {saveClassifiersError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {saveClassifiersError}
            </Alert>
          ) : null}
          {availableClassifiersLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <List dense>
              {availableClassifiers.map((classifier) => {
                const checked = selectedClassifierIds.includes(classifier.id);
                return (
                  <ListItemButton key={classifier.id} onClick={() => toggleSelectedClassifier(classifier.id)}>
                    <ListItemIcon>
                      <Checkbox edge="start" checked={checked} tabIndex={-1} disableRipple />
                    </ListItemIcon>
                    <ListItemText primary={personDisplayName(classifier)} />
                  </ListItemButton>
                );
              })}
              {availableClassifiers.length === 0 && !availableClassifiersError ? (
                <Typography color="textSecondary" sx={{ py: 1 }}>
                  Brak dostępnych klasyfikatorów w tym sezonie.
                </Typography>
              ) : null}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAddClassifiersDialog} disabled={saveClassifiersLoading}>
            Anuluj
          </Button>
          <Button
            variant="contained"
            onClick={saveSelectedClassifiers}
            disabled={saveClassifiersLoading || availableClassifiersLoading}
          >
            Dodaj
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmationDialog
        open={Boolean(classifierToRemove)}
        title="Usunąć klasyfikatora z turnieju?"
        description={
          classifierToRemove ? (
            <Typography color="textSecondary">
              Klasyfikator: <strong>{personDisplayName(classifierToRemove)}</strong>
            </Typography>
          ) : null
        }
        onClose={closeRemoveClassifierDialog}
        onConfirm={confirmRemoveClassifier}
        loading={removeClassifierLoading}
        errorMessage={removeClassifierError}
        confirmLabel="Usuń"
        cancelLabel="Anuluj"
      />
    </Box>
  );
}
