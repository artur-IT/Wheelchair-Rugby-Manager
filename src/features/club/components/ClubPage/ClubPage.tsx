import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Box } from "@mui/material";
import AppShell from "@/components/AppShell/AppShell";
import QueryProvider from "@/components/QueryProvider/QueryProvider";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import ClubHeaderCard from "@/features/club/components/ClubPage/ClubHeaderCard";
import ClubPersonnelTabsSection from "@/features/club/components/ClubPage/ClubPersonnelTabsSection";
import TeamsSectionCard from "@/features/club/components/ClubPage/TeamsSectionCard";
import type {
  ClubCoachDto,
  ClubCreatePayload,
  ClubDto,
  ClubPlayerDto,
  ClubRefereeDto,
  ClubStaffDto,
  ClubTeamDto,
  ClubVolunteerDto,
} from "@/features/club/components/ClubPage/types";

interface ApiValidationErrorShape {
  formErrors?: unknown;
  fieldErrors?: Record<string, unknown>;
}

const MAX_LOGO_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const MAX_LOGO_DIMENSION_PX = 1024;
const ALLOWED_LOGO_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

const extractApiErrorMessage = (data: unknown, fallback: string): string => {
  if (!data || typeof data !== "object") return fallback;
  const errorValue = (data as { error?: unknown }).error;
  if (typeof errorValue === "string" && errorValue.trim().length > 0) return errorValue;

  if (errorValue && typeof errorValue === "object") {
    const validation = errorValue as ApiValidationErrorShape;
    const formError =
      Array.isArray(validation.formErrors) && typeof validation.formErrors[0] === "string"
        ? validation.formErrors[0]
        : null;
    if (formError) return formError;

    if (validation.fieldErrors && typeof validation.fieldErrors === "object") {
      const firstFieldError = Object.values(validation.fieldErrors).find(
        (value) => Array.isArray(value) && typeof value[0] === "string"
      ) as string[] | undefined;
      if (firstFieldError?.[0]) return firstFieldError[0];
    }
  }

  return fallback;
};

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
  if (!res.ok) throw new Error(extractApiErrorMessage(data, "Nie udało się utworzyć klubu"));
  return data;
};

const updateClub = async (payload: ClubCreatePayload & { id: string }): Promise<ClubDto> => {
  const { id, ...body } = payload;
  const res = await fetch(`/api/club/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(extractApiErrorMessage(data, "Nie udało się zaktualizować klubu"));
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

const fetchVolunteers = async (clubId: string): Promise<ClubVolunteerDto[]> => {
  const res = await fetch(`/api/club/${clubId}/volunteers`);
  if (!res.ok) throw new Error("Nie udało się pobrać wolontariuszy");
  return res.json();
};

const fetchReferees = async (clubId: string): Promise<ClubRefereeDto[]> => {
  const res = await fetch(`/api/club/${clubId}/referees`);
  if (!res.ok) throw new Error("Nie udało się pobrać sędziów");
  return res.json();
};

const fetchStaff = async (clubId: string): Promise<ClubStaffDto[]> => {
  const res = await fetch(`/api/club/${clubId}/staff`);
  if (!res.ok) throw new Error("Nie udało się pobrać pozostałego personelu");
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

const updateClubTeam = async (payload: {
  teamId: string;
  clubId: string;
  name: string;
  formula: "WR4" | "WR5";
  coachId?: string;
  playerIds: string[];
}): Promise<ClubTeamDto> => {
  const { teamId, clubId, name, formula, coachId, playerIds } = payload;
  const res = await fetch(`/api/club/teams/${teamId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clubId,
      name,
      formula,
      ...(coachId?.trim() ? { coachId: coachId.trim() } : {}),
      playerIds,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "Nie udało się zaktualizować drużyny");
  return data;
};

const deleteClubTeam = async ({ teamId }: { clubId: string; teamId: string }): Promise<void> => {
  const res = await fetch(`/api/club/teams/${teamId}`, { method: "DELETE" });
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      data && typeof data === "object" && typeof (data as { error?: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Nie udało się usunąć drużyny"
    );
  }
};

const readFileAsDataUrl = async (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Nie udało się wczytać pliku logo"));
    reader.readAsDataURL(file);
  });

const readImageDimensions = async (file: File): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(objectUrl);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Nie udało się odczytać wymiarów obrazu"));
    };
    image.src = objectUrl;
  });

function ClubPageContent() {
  const queryClient = useQueryClient();
  const [clubName, setClubName] = useState("");
  const [clubLogoUrl, setClubLogoUrl] = useState("");
  const [logoErrorMessage, setLogoErrorMessage] = useState<string | null>(null);
  const [showClubForm, setShowClubForm] = useState(false);
  const [isClubEditMode, setIsClubEditMode] = useState(false);
  const [selectedClubId, setSelectedClubId] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamFormula, setTeamFormula] = useState<"WR4" | "WR5">("WR4");
  const [teamCoachId, setTeamCoachId] = useState("");
  const [teamPlayerIds, setTeamPlayerIds] = useState<string[]>([]);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamPendingDelete, setTeamPendingDelete] = useState<ClubTeamDto | null>(null);

  const clubsQuery = useQuery({
    queryKey: ["club", "list"],
    queryFn: fetchClubs,
  });

  const createClubMutation = useMutation({
    mutationFn: createClub,
    onSuccess: () => {
      setClubName("");
      setClubLogoUrl("");
      setLogoErrorMessage(null);
      setShowClubForm(false);
      return queryClient.invalidateQueries({ queryKey: ["club", "list"] });
    },
  });

  const updateClubMutation = useMutation({
    mutationFn: updateClub,
    onSuccess: () => {
      setShowClubForm(false);
      setIsClubEditMode(false);
      return queryClient.invalidateQueries({ queryKey: ["club", "list"] });
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

  const volunteersQuery = useQuery({
    queryKey: ["club", "volunteers", selectedClubId],
    queryFn: () => fetchVolunteers(selectedClubId),
    enabled: selectedClubId.length > 0,
  });

  const refereesQuery = useQuery({
    queryKey: ["club", "referees", selectedClubId],
    queryFn: () => fetchReferees(selectedClubId),
    enabled: selectedClubId.length > 0,
  });

  const staffQuery = useQuery({
    queryKey: ["club", "staff", selectedClubId],
    queryFn: () => fetchStaff(selectedClubId),
    enabled: selectedClubId.length > 0,
  });

  const createTeamMutation = useMutation({
    mutationFn: createTeam,
    onSuccess: async (_data, variables) => {
      setTeamName("");
      setTeamFormula("WR4");
      setTeamCoachId("");
      setTeamPlayerIds([]);
      setEditingTeamId(null);
      setShowTeamForm(false);
      await queryClient.invalidateQueries({ queryKey: ["club", "teams", variables.clubId] });
    },
  });

  const updateTeamMutation = useMutation({
    mutationFn: updateClubTeam,
    onSuccess: async (_data, variables) => {
      setTeamName("");
      setTeamFormula("WR4");
      setTeamCoachId("");
      setTeamPlayerIds([]);
      setEditingTeamId(null);
      setShowTeamForm(false);
      await queryClient.invalidateQueries({ queryKey: ["club", "teams", variables.clubId] });
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: deleteClubTeam,
    onSuccess: async (_data, variables) => {
      setTeamPendingDelete(null);
      await queryClient.invalidateQueries({ queryKey: ["club", "teams", variables.clubId] });
    },
  });

  useEffect(() => {
    if (!selectedClubId && sortedClubs.length > 0) {
      setSelectedClubId(sortedClubs[0].id);
    }
  }, [selectedClubId, sortedClubs]);

  return (
    <Box sx={{ maxWidth: 980, mx: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
      <ClubHeaderCard
        isLoading={clubsQuery.isPending}
        errorMessage={clubsQuery.error instanceof Error ? clubsQuery.error.message : null}
        selectedClub={selectedClub}
        showClubForm={showClubForm}
        isEditMode={isClubEditMode}
        clubName={clubName}
        clubLogoPreviewUrl={clubLogoUrl}
        logoErrorMessage={logoErrorMessage}
        isCreatePending={createClubMutation.isPending || updateClubMutation.isPending}
        createErrorMessage={
          (createClubMutation.error instanceof Error ? createClubMutation.error.message : null) ??
          (updateClubMutation.error instanceof Error ? updateClubMutation.error.message : null)
        }
        onShowClubForm={() => {
          setIsClubEditMode(false);
          setClubName("");
          setClubLogoUrl("");
          setLogoErrorMessage(null);
          setShowClubForm(true);
        }}
        onShowClubEditForm={() => {
          if (!selectedClub) return;
          setIsClubEditMode(true);
          setClubName(selectedClub.name ?? "");
          setClubLogoUrl(selectedClub.logoUrl ?? "");
          setLogoErrorMessage(null);
          setShowClubForm(true);
        }}
        onCancelClubForm={() => {
          setShowClubForm(false);
          setIsClubEditMode(false);
          setClubName("");
          setClubLogoUrl("");
          setLogoErrorMessage(null);
        }}
        onClubNameChange={setClubName}
        onClubLogoFileChange={(file) => {
          if (!file) {
            setClubLogoUrl("");
            setLogoErrorMessage(null);
            return;
          }
          void (async () => {
            if (!ALLOWED_LOGO_MIME_TYPES.has(file.type)) {
              setClubLogoUrl("");
              setLogoErrorMessage("Nieobsługiwany format pliku. Wybierz PNG, JPG albo WEBP.");
              return;
            }
            if (file.size > MAX_LOGO_FILE_SIZE_BYTES) {
              setClubLogoUrl("");
              setLogoErrorMessage("Plik jest za duży. Maksymalny rozmiar logo to 2MB.");
              return;
            }

            try {
              const dimensions = await readImageDimensions(file);
              if (dimensions.width > MAX_LOGO_DIMENSION_PX || dimensions.height > MAX_LOGO_DIMENSION_PX) {
                setClubLogoUrl("");
                setLogoErrorMessage("Obraz jest za duży. Maksymalny wymiar to 1024x1024 px.");
                return;
              }

              const dataUrl = await readFileAsDataUrl(file);
              setClubLogoUrl(dataUrl);
              setLogoErrorMessage(null);
            } catch {
              setClubLogoUrl("");
              setLogoErrorMessage("Nie udało się odczytać pliku graficznego.");
            }
          })();
        }}
        onSaveClub={() => {
          const payload = {
            name: clubName.trim(),
            logoUrl: clubLogoUrl.trim(),
          };

          if (isClubEditMode && selectedClub) {
            updateClubMutation.mutate({ id: selectedClub.id, ...payload });
            return;
          }
          createClubMutation.mutate(payload);
        }}
      />

      {selectedClubId ? (
        <TeamsSectionCard
          teams={teamsQuery.data ?? []}
          isTeamsLoading={teamsQuery.isPending}
          showTeamForm={showTeamForm}
          isEditingTeam={editingTeamId !== null}
          coaches={coachesQuery.data ?? []}
          players={playersQuery.data ?? []}
          teamName={teamName}
          teamFormula={teamFormula}
          teamCoachId={teamCoachId}
          teamPlayerIds={teamPlayerIds}
          teamFormErrorMessage={
            (createTeamMutation.error instanceof Error ? createTeamMutation.error.message : null) ??
            (updateTeamMutation.error instanceof Error ? updateTeamMutation.error.message : null)
          }
          isTeamFormPending={createTeamMutation.isPending || updateTeamMutation.isPending}
          teamPendingDelete={teamPendingDelete}
          deleteTeamErrorMessage={deleteTeamMutation.error instanceof Error ? deleteTeamMutation.error.message : null}
          isDeleteTeamPending={deleteTeamMutation.isPending}
          onShowTeamForm={() => {
            setEditingTeamId(null);
            setTeamName("");
            setTeamFormula("WR4");
            setTeamCoachId("");
            setTeamPlayerIds([]);
            setShowTeamForm(true);
          }}
          onTeamNameChange={setTeamName}
          onTeamFormulaChange={setTeamFormula}
          onTeamCoachChange={setTeamCoachId}
          onTeamPlayersChange={setTeamPlayerIds}
          onSubmitTeamForm={() => {
            if (editingTeamId) {
              updateTeamMutation.mutate({
                teamId: editingTeamId,
                clubId: selectedClubId,
                name: teamName.trim(),
                formula: teamFormula,
                coachId: teamCoachId || undefined,
                playerIds: teamPlayerIds,
              });
              return;
            }
            createTeamMutation.mutate({
              clubId: selectedClubId,
              name: teamName.trim(),
              formula: teamFormula,
              coachId: teamCoachId || undefined,
              playerIds: teamPlayerIds,
            });
          }}
          onCancelTeamForm={() => {
            setTeamName("");
            setTeamFormula("WR4");
            setTeamCoachId("");
            setTeamPlayerIds([]);
            setEditingTeamId(null);
            setShowTeamForm(false);
            createTeamMutation.reset();
            updateTeamMutation.reset();
          }}
          onEditTeam={(team) => {
            setEditingTeamId(team.id);
            setTeamName(team.name);
            setTeamFormula(team.formula);
            setTeamCoachId(team.coach?.id ?? "");
            setTeamPlayerIds(team.players.map((row) => row.player.id));
            setShowTeamForm(true);
          }}
          onTeamPendingDeleteChange={(team) => {
            setTeamPendingDelete(team);
            if (team === null) deleteTeamMutation.reset();
          }}
          onConfirmDeleteTeam={() => {
            if (teamPendingDelete) {
              deleteTeamMutation.mutate({ clubId: selectedClubId, teamId: teamPendingDelete.id });
            }
          }}
        />
      ) : null}

      {selectedClubId ? (
        <ClubPersonnelTabsSection
          clubId={selectedClubId}
          players={playersQuery.data ?? []}
          playersLoading={playersQuery.isPending}
          playersError={playersQuery.error instanceof Error ? playersQuery.error.message : null}
          onRetryPlayers={() => void playersQuery.refetch()}
          volunteers={volunteersQuery.data ?? []}
          volunteersLoading={volunteersQuery.isPending}
          volunteersError={volunteersQuery.error instanceof Error ? volunteersQuery.error.message : null}
          onRetryVolunteers={() => void volunteersQuery.refetch()}
          coaches={coachesQuery.data ?? []}
          coachesLoading={coachesQuery.isPending}
          coachesError={coachesQuery.error instanceof Error ? coachesQuery.error.message : null}
          onRetryCoaches={() => void coachesQuery.refetch()}
          referees={refereesQuery.data ?? []}
          refereesLoading={refereesQuery.isPending}
          refereesError={refereesQuery.error instanceof Error ? refereesQuery.error.message : null}
          onRetryReferees={() => void refereesQuery.refetch()}
          others={(staffQuery.data ?? []).filter((person) => person.role === "OTHER")}
          othersLoading={staffQuery.isPending}
          othersError={staffQuery.error instanceof Error ? staffQuery.error.message : null}
          onRetryOthers={() => void staffQuery.refetch()}
        />
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
