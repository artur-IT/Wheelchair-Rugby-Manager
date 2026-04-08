import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AppShell from "@/components/AppShell/AppShell";
import QueryProvider from "@/components/QueryProvider/QueryProvider";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";

interface ClubDto {
  id: string;
  ownerUserId: string;
  name: string;
  contactAddress?: string | null;
  contactCity?: string | null;
  contactPostalCode?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  websiteUrl?: string | null;
  logoUrl?: string | null;
  contactFirstName?: string | null;
  contactLastName?: string | null;
  hallName?: string | null;
  hallAddress?: string | null;
  hallCity?: string | null;
  hallPostalCode?: string | null;
  hallMapUrl?: string | null;
  createdAt: string;
}

interface ClubCreatePayload {
  name: string;
}

interface ClubCoachDto {
  id: string;
  firstName: string;
  lastName: string;
}

interface ClubPlayerDto {
  id: string;
  firstName: string;
  lastName: string;
}

interface ClubTeamDto {
  id: string;
  name: string;
  formula: "WR4" | "WR5";
  coach?: ClubCoachDto | null;
  players: { player: ClubPlayerDto }[];
}

const fetchClubs = async (): Promise<ClubDto[]> => {
  const res = await fetch("/api/club");
  if (!res.ok) throw new Error("Nie udało się pobrać klubów");
  return res.json();
};

const createClub = async (payload: ClubCreatePayload): Promise<ClubDto> => {
  const res = await fetch("/api/club", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "Nie udało się utworzyć klubu");
  return data;
};

const updateClub = async (club: ClubDto): Promise<ClubDto> => {
  const res = await fetch(`/api/club/${club.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(club),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "Nie udało się zapisać klubu");
  return data;
};

const fetchCoaches = async (clubId: string): Promise<ClubCoachDto[]> => {
  const res = await fetch(`/api/club/${clubId}/coaches`);
  if (!res.ok) throw new Error("Nie udało się pobrać trenerów");
  return res.json();
};

const fetchPlayers = async (clubId: string): Promise<ClubPlayerDto[]> => {
  const res = await fetch(`/api/club/${clubId}/players`);
  if (!res.ok) throw new Error("Nie udało się pobrać zawodników");
  return res.json();
};

const fetchTeams = async (clubId: string): Promise<ClubTeamDto[]> => {
  const res = await fetch(`/api/club/${clubId}/teams`);
  if (!res.ok) throw new Error("Nie udało się pobrać drużyn");
  return res.json();
};

const createTeam = async (payload: {
  clubId: string;
  name: string;
  formula: "WR4" | "WR5";
  coachId?: string;
  playerIds: string[];
}): Promise<ClubTeamDto> => {
  const { clubId, ...body } = payload;
  const res = await fetch(`/api/club/${clubId}/teams`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "Nie udało się utworzyć drużyny");
  return data;
};

function ClubPageContent() {
  const queryClient = useQueryClient();
  const [clubName, setClubName] = useState("");
  const [selectedClubId, setSelectedClubId] = useState("");
  const [clubForm, setClubForm] = useState<ClubDto | null>(null);
  const [teamName, setTeamName] = useState("");
  const [teamFormula, setTeamFormula] = useState<"WR4" | "WR5">("WR4");
  const [teamCoachId, setTeamCoachId] = useState("");
  const [teamPlayerIds, setTeamPlayerIds] = useState<string[]>([]);

  const clubsQuery = useQuery({
    queryKey: ["club", "list"],
    queryFn: fetchClubs,
  });

  const createClubMutation = useMutation({
    mutationFn: createClub,
    onSuccess: () => {
      setClubName("");
      return queryClient.invalidateQueries({ queryKey: ["club", "list"] });
    },
  });

  const updateClubMutation = useMutation({
    mutationFn: updateClub,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["club", "list"] });
    },
  });

  const sortedClubs = useMemo(
    () => [...(clubsQuery.data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [clubsQuery.data]
  );
  const selectedClub = useMemo(
    () => sortedClubs.find((club) => club.id === selectedClubId) ?? null,
    [sortedClubs, selectedClubId]
  );

  const coachesQuery = useQuery({
    queryKey: ["club", "coaches", selectedClubId],
    queryFn: () => fetchCoaches(selectedClubId),
    enabled: selectedClubId.length > 0,
  });

  const playersQuery = useQuery({
    queryKey: ["club", "players", selectedClubId],
    queryFn: () => fetchPlayers(selectedClubId),
    enabled: selectedClubId.length > 0,
  });

  const teamsQuery = useQuery({
    queryKey: ["club", "teams", selectedClubId],
    queryFn: () => fetchTeams(selectedClubId),
    enabled: selectedClubId.length > 0,
  });

  const createTeamMutation = useMutation({
    mutationFn: createTeam,
    onSuccess: async () => {
      setTeamName("");
      setTeamFormula("WR4");
      setTeamCoachId("");
      setTeamPlayerIds([]);
      await queryClient.invalidateQueries({ queryKey: ["club", "teams", selectedClubId] });
    },
  });

  useEffect(() => {
    if (!selectedClubId && sortedClubs.length > 0) {
      setSelectedClubId(sortedClubs[0].id);
    }
  }, [selectedClubId, sortedClubs]);

  useEffect(() => {
    if (selectedClub) {
      setClubForm(selectedClub);
    }
  }, [selectedClub]);

  return (
    <Box sx={{ maxWidth: 980, mx: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
          Mój Klub Sportowy
        </Typography>
        <Typography color="text.secondary">Niezależny moduł do zarządzania klubem i personelem.</Typography>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Lista klubów
          </Typography>
          {clubsQuery.isPending ? <CircularProgress size={22} /> : null}
          {clubsQuery.error instanceof Error ? (
            <Typography color="error.main">{clubsQuery.error.message}</Typography>
          ) : null}
          {!clubsQuery.isPending && sortedClubs.length === 0 ? (
            <Stack gap={1.5}>
              <Typography color="text.secondary">Nie masz jeszcze klubu. Utwórz pierwszy klub.</Typography>
              <Stack direction={{ xs: "column", md: "row" }} gap={2}>
                <TextField
                  label="Nazwa klubu"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  fullWidth
                />
                <Button
                  variant="contained"
                  disabled={!clubName.trim() || createClubMutation.isPending}
                  onClick={() => createClubMutation.mutate({ name: clubName.trim() })}
                >
                  Utwórz klub
                </Button>
              </Stack>
              {createClubMutation.error instanceof Error ? (
                <Typography color="error.main">{createClubMutation.error.message}</Typography>
              ) : null}
            </Stack>
          ) : null}
          <Stack gap={1.5}>
            {sortedClubs.map((club) => (
              <Card key={club.id} variant="outlined">
                <CardContent>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
                    <Typography sx={{ fontWeight: 700 }}>{club.name}</Typography>
                    <Button
                      size="small"
                      variant={selectedClubId === club.id ? "contained" : "outlined"}
                      onClick={() => setSelectedClubId(club.id)}
                    >
                      {selectedClubId === club.id ? "Aktywny" : "Wybierz"}
                    </Button>
                  </Stack>
                  <Typography color="text.secondary" variant="body2">
                    {club.contactCity ?? "Brak miasta"} {club.websiteUrl ? `• ${club.websiteUrl}` : ""}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {clubForm ? (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Klub sportowy (header)
            </Typography>
            <Stack gap={2}>
              <TextField
                label="Nazwa klubu"
                value={clubForm.name}
                onChange={(e) => setClubForm((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
              />
              <Stack direction={{ xs: "column", md: "row" }} gap={2}>
                <TextField
                  label="Email kontaktowy"
                  value={clubForm.contactEmail ?? ""}
                  onChange={(e) => setClubForm((prev) => (prev ? { ...prev, contactEmail: e.target.value } : prev))}
                  fullWidth
                />
                <TextField
                  label="Telefon kontaktowy"
                  value={clubForm.contactPhone ?? ""}
                  onChange={(e) => setClubForm((prev) => (prev ? { ...prev, contactPhone: e.target.value } : prev))}
                  fullWidth
                />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} gap={2}>
                <TextField
                  label="Miasto"
                  value={clubForm.contactCity ?? ""}
                  onChange={(e) => setClubForm((prev) => (prev ? { ...prev, contactCity: e.target.value } : prev))}
                  fullWidth
                />
                <TextField
                  label="Strona WWW"
                  value={clubForm.websiteUrl ?? ""}
                  onChange={(e) => setClubForm((prev) => (prev ? { ...prev, websiteUrl: e.target.value } : prev))}
                  fullWidth
                />
              </Stack>
              <Button
                variant="contained"
                disabled={updateClubMutation.isPending}
                onClick={() => updateClubMutation.mutate(clubForm)}
              >
                Zapisz dane klubu
              </Button>
              {updateClubMutation.error instanceof Error ? (
                <Typography color="error.main">{updateClubMutation.error.message}</Typography>
              ) : null}
            </Stack>
          </CardContent>
        </Card>
      ) : null}

      {selectedClubId ? (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Drużyny
            </Typography>
            <Stack gap={2} sx={{ mb: 3 }}>
              <TextField label="Nazwa drużyny" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
              <Stack direction={{ xs: "column", md: "row" }} gap={2}>
                <TextField
                  select
                  label="Formuła"
                  value={teamFormula}
                  onChange={(e) => setTeamFormula(e.target.value as "WR4" | "WR5")}
                  fullWidth
                >
                  <MenuItem value="WR4">WR&apos;4</MenuItem>
                  <MenuItem value="WR5">WR&apos;5</MenuItem>
                </TextField>
                <TextField
                  select
                  label="Trener"
                  value={teamCoachId}
                  onChange={(e) => setTeamCoachId(e.target.value)}
                  fullWidth
                >
                  <MenuItem value="">Bez trenera</MenuItem>
                  {(coachesQuery.data ?? []).map((coach) => (
                    <MenuItem key={coach.id} value={coach.id}>
                      {coach.firstName} {coach.lastName}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
              <TextField
                select
                label="Zawodnicy (możesz wybrać wielu)"
                value={teamPlayerIds}
                onChange={(e) => setTeamPlayerIds(typeof e.target.value === "string" ? [] : e.target.value)}
                SelectProps={{ multiple: true }}
              >
                {(playersQuery.data ?? []).map((player) => (
                  <MenuItem key={player.id} value={player.id}>
                    {player.firstName} {player.lastName}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                variant="contained"
                disabled={!teamName.trim() || createTeamMutation.isPending}
                onClick={() =>
                  createTeamMutation.mutate({
                    clubId: selectedClubId,
                    name: teamName.trim(),
                    formula: teamFormula,
                    coachId: teamCoachId || undefined,
                    playerIds: teamPlayerIds,
                  })
                }
              >
                Dodaj drużynę
              </Button>
              {createTeamMutation.error instanceof Error ? (
                <Typography color="error.main">{createTeamMutation.error.message}</Typography>
              ) : null}
            </Stack>

            {teamsQuery.isPending ? <CircularProgress size={22} /> : null}
            <Stack gap={1.5}>
              {(teamsQuery.data ?? []).map((team) => (
                <Card key={team.id} variant="outlined">
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
                      <Typography sx={{ fontWeight: 700 }}>{team.name}</Typography>
                      <Chip label={team.formula === "WR4" ? "WR'4" : "WR'5"} size="small" />
                    </Stack>
                    <Typography color="text.secondary" variant="body2">
                      Trener: {team.coach ? `${team.coach.firstName} ${team.coach.lastName}` : "brak"}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      Zawodnicy:{" "}
                      {team.players.length > 0
                        ? team.players.map((p) => `${p.player.firstName} ${p.player.lastName}`).join(", ")
                        : "brak"}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </CardContent>
        </Card>
      ) : null}
    </Box>
  );
}

export default function ClubPage() {
  return (
    <QueryProvider>
      <ThemeRegistry>
        <AppShell currentPath="/club">
          <ClubPageContent />
        </AppShell>
      </ThemeRegistry>
    </QueryProvider>
  );
}
