import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { forwardRef, useState, useEffect, useMemo } from "react";
import type { ChangeEvent } from "react";
import { sanitizePhone, MAX_SHORT_TEXT } from "@/lib/validateInputs";
import { Users, UserCircle, ChevronRight, Pencil, Star } from "lucide-react";
import {
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Tabs,
  Tab,
  Avatar,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
} from "@mui/material";
import type { SelectChangeEvent, TabProps } from "@mui/material";
import { Trash2 } from "lucide-react";
import type { Season, Person } from "@/types";
import { useDefaultSeason } from "@/components/hooks/useDefaultSeason";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import DataLoadAlert from "@/components/ui/DataLoadAlert";
import AppShell from "@/components/AppShell/AppShell";
import QueryProvider from "@/components/QueryProvider/QueryProvider";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import { fetchPersonnelBySeason } from "@/lib/api/personnel";
import { fetchSeasonsList, deleteSeasonById } from "@/lib/api/seasons";
import { fetchTeamsBySeason } from "@/lib/api/teams";
import { queryKeys } from "@/lib/queryKeys";
import { parseFormErrorFromResponse } from "@/lib/apiHttp";

type TabValue = "teams" | "referees" | "classifiers";

export default function SettingsPage() {
  return (
    <QueryProvider>
      <ThemeRegistry>
        <AppShell currentPath="/settings">
          <SettingsContent />
        </AppShell>
      </ThemeRegistry>
    </QueryProvider>
  );
}

const StyledTab = forwardRef<HTMLAnchorElement, TabProps>((props, ref) => (
  <Tab ref={ref} component="a" iconPosition="start" {...props} />
));

StyledTab.displayName = "StyledTab";

function SeasonsManager({ onSeasonChange }: { onSeasonChange: (seasonId: string) => void }) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { defaultSeasonId, saveDefault } = useDefaultSeason();

  const {
    data: seasonsData,
    isPending: seasonsLoading,
    isError: seasonsQueryFailed,
    error: seasonsQueryError,
    refetch: refetchSeasons,
  } = useQuery({
    queryKey: queryKeys.seasons.list(),
    queryFn: ({ signal }) => fetchSeasonsList(signal),
  });

  const deleteSeasonMutation = useMutation({
    mutationFn: deleteSeasonById,
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<Season[]>(queryKeys.seasons.list(), (old) =>
        (old ?? []).filter((s) => s.id !== deletedId)
      );
      setSelectedId((prev) => {
        if (prev !== deletedId) return prev;
        const remaining = queryClient.getQueryData<Season[]>(queryKeys.seasons.list()) ?? [];
        return remaining[0]?.id ?? "";
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });

  const seasons = useMemo(() => seasonsData ?? [], [seasonsData]);
  const loadError = seasonsQueryFailed && seasonsQueryError instanceof Error ? seasonsQueryError.message : null;

  useEffect(() => {
    if (seasons.length === 0) {
      setSelectedId("");
      return;
    }
    const savedExists = Boolean(defaultSeasonId && seasons.some((s) => s.id === defaultSeasonId));
    setSelectedId(savedExists ? (defaultSeasonId ?? "") : seasons[0].id);
  }, [seasons, defaultSeasonId]);

  useEffect(() => {
    onSeasonChange(selectedId);
  }, [onSeasonChange, selectedId]);

  const handleDeleteConfirmed = () => {
    setConfirmOpen(false);
    deleteSeasonMutation.mutate(selectedId);
  };

  const selectedSeason = seasons.find((s) => s.id === selectedId);

  if (seasonsLoading) return <CircularProgress size={20} sx={{ mb: 3 }} />;

  if (loadError && seasons.length === 0) {
    return <DataLoadAlert message={loadError} onRetry={() => void refetchSeasons()} sx={{ mb: 3 }} />;
  }

  if (seasons.length === 0) {
    return (
      <Alert
        severity="warning"
        sx={{ mb: 3 }}
        action={
          <Button color="inherit" size="small" component="a" href="/settings/seasons/new">
            Utwórz sezon
          </Button>
        }
      >
        Brak sezonu — dodaj drużyny dopiero po utworzeniu sezonu.
      </Alert>
    );
  }

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3, flexWrap: "wrap" }}>
        {/* Season selector */}
        <FormControl size="small" sx={{ minWidth: 240 }}>
          <InputLabel>Sezon</InputLabel>
          <Select label="Sezon" value={selectedId} onChange={(e: SelectChangeEvent) => setSelectedId(e.target.value)}>
            {seasons.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name}
                {s.year ? ` (${s.year})` : ""}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Set as default season */}
        <IconButton
          onClick={() => saveDefault(selectedId)}
          disabled={!selectedId}
          title="Ustaw jako domyślny sezon"
          color={selectedId === defaultSeasonId ? "warning" : "default"}
        >
          <Star size={18} fill={selectedId === defaultSeasonId ? "currentColor" : "none"} />
        </IconButton>

        {/* Edit selected season */}
        <IconButton
          component="a"
          href={`/settings/seasons/${selectedId}/edit`}
          disabled={!selectedId}
          title="Edytuj sezon"
        >
          <Pencil size={18} />
        </IconButton>

        {/* Delete selected season — opens confirmation modal */}
        <IconButton
          color="error"
          onClick={() => setConfirmOpen(true)}
          disabled={deleteSeasonMutation.isPending || !selectedId}
          title="Usuń sezon"
        >
          {deleteSeasonMutation.isPending ? <CircularProgress size={20} /> : <Trash2 size={18} />}
        </IconButton>

        {/* Add new season */}
        <Button variant="outlined" size="small" component="a" href="/settings/seasons/new">
          + Nowy sezon
        </Button>

        {deleteSeasonMutation.isError && deleteSeasonMutation.error instanceof Error ? (
          <Alert severity="error" sx={{ py: 0 }}>
            {deleteSeasonMutation.error.message}
          </Alert>
        ) : null}
      </Box>

      {/* Delete confirmation dialog */}
      <ConfirmationDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteConfirmed}
        loading={deleteSeasonMutation.isPending}
        title="Usuń sezon"
        description={
          <DialogContentText>
            Czy na pewno chcesz usunąć sezon <strong>{selectedSeason?.name}</strong>? Tej operacji nie można cofnąć.
          </DialogContentText>
        }
      />
    </>
  );
}

function SettingsContent() {
  const [activeTab, setActiveTab] = useState<TabValue>("teams");
  const [selectedSeasonId, setSelectedSeasonId] = useState("");

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", mb: 0.5 }}>
          Ustawienia Sezonu
        </Typography>
        <Typography color="textSecondary">Zarządzaj globalnymi danymi ligi.</Typography>
      </Box>
      <SeasonsManager onSeasonChange={setSelectedSeasonId} />

      <Paper sx={{ borderRadius: 3 }}>
        <Tabs value={activeTab} onChange={(_, v: TabValue) => setActiveTab(v)} variant="fullWidth">
          <StyledTab label="Drużyny" value="teams" icon={<Users size={18} />} />
          <StyledTab label="Sędziowie" value="referees" icon={<UserCircle size={18} />} />
          <StyledTab label="Klasyfikatorzy" value="classifiers" icon={<UserCircle size={18} />} />
        </Tabs>

        <CardContent sx={{ minHeight: 400 }}>
          {activeTab === "teams" && <TeamsTab seasonId={selectedSeasonId} />}
          {activeTab === "referees" && <RefereesTab seasonId={selectedSeasonId} />}
          {activeTab === "classifiers" && <ClassifiersTab seasonId={selectedSeasonId} />}
        </CardContent>
      </Paper>
    </Box>
  );
}

/*  TEAMS TAB */
function TeamsTab({ seasonId }: { seasonId: string }) {
  const {
    data: teams = [],
    isPending: loadingTeams,
    isError: teamsQueryFailed,
    error: teamsQueryError,
    refetch: refetchTeams,
  } = useQuery({
    queryKey: queryKeys.teams.bySeason(seasonId || "__none__"),
    queryFn: ({ signal }) => {
      if (!seasonId) return Promise.reject(new Error("Brak sezonu"));
      return fetchTeamsBySeason(seasonId, signal);
    },
    enabled: Boolean(seasonId),
  });

  const teamsError = teamsQueryFailed && teamsQueryError instanceof Error ? teamsQueryError.message : null;

  if (!seasonId) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        Wybierz sezon, aby zobaczyć drużyny.
      </Alert>
    );
  }

  if (loadingTeams) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (teamsError) {
    return <DataLoadAlert message={teamsError} onRetry={() => void refetchTeams()} />;
  }

  if (teams.length === 0) {
    return (
      <Alert
        severity="info"
        sx={{ mb: 2 }}
        action={
          <Button component="a" href="/settings/teams/new" color="inherit" size="small">
            Dodaj drużynę
          </Button>
        }
      >
        Brak drużyn. Dodaj pierwszą drużynę, aby zobaczyć ją na liście.
      </Alert>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          Lista Drużyn
        </Typography>
        <Button component="a" href="/settings/teams/new" variant="contained" color="success" size="small">
          + Nowa Drużyna
        </Button>
      </Box>
      <Grid container spacing={2}>
        {teams.map((team) => (
          <Grid size={{ xs: 12, sm: 6 }} key={team.id}>
            <Card
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: "primary.main" }}>{team.name[0] ?? "?"}</Avatar>
                <Box>
                  <Typography sx={{ fontWeight: "bold" }}>{team.name}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {team.players?.length ?? 0} zawodników
                  </Typography>
                </Box>
              </Box>
              <IconButton component="a" href={`/settings/teams/${team.id}`} size="small">
                <ChevronRight />
              </IconButton>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

/*  PERSONEL TAB - Referees, Classifiers */
interface PersonFormPayload {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
}

interface PersonnelTableProps {
  title: string;
  data: Person[];
  onAddClick: () => void;
  onEdit?: (person: Person) => void;
  onDelete?: (person: Person) => void;
  deletingId?: string | null;
}

interface PersonnelConfig {
  apiEndpoint: string;
  queryKey: (seasonId: string) => readonly unknown[];
  title: string;
  noSeasonMessage: string;
  emptyMessage: string;
  emptyActionLabel: string;
  dialogTitles: {
    add: string;
    edit: string;
  };
  deleteDialogTitle: string;
  messages: {
    loadError: string;
    loadFallback: string;
    createError: string;
    createFallback: string;
    updateError: string;
    updateFallback: string;
    deleteError: string;
    deleteFallback: string;
  };
}

const REFEREES_CONFIG: PersonnelConfig = {
  apiEndpoint: "/api/referees",
  queryKey: (seasonId) => queryKeys.referees.bySeason(seasonId),
  title: "Sędziowie",
  noSeasonMessage: "Wybierz sezon, aby zarządzać sędziami.",
  emptyMessage: "Brak zapisanych sędziów. Dodaj pierwszego sędziego, aby rozdzielać mecze.",
  emptyActionLabel: "Dodaj Sędziego",
  dialogTitles: {
    add: "Dodaj Sędziego",
    edit: "Edytuj Sędziego",
  },
  deleteDialogTitle: "Usuń sędziego",
  messages: {
    loadError: "Nie udało się pobrać sędziów",
    loadFallback: "Wystąpił błąd podczas pobierania sędziów",
    createError: "Nie udało się dodać sędziego",
    createFallback: "Wystąpił błąd podczas zapisu sędziego",
    updateError: "Nie udało się zaktualizować sędziego",
    updateFallback: "Wystąpił błąd podczas zapisu sędziego",
    deleteError: "Nie udało się usunąć sędziego",
    deleteFallback: "Wystąpił błąd podczas usuwania",
  },
};

const CLASSIFIERS_CONFIG: PersonnelConfig = {
  apiEndpoint: "/api/classifiers",
  queryKey: (seasonId) => queryKeys.classifiers.bySeason(seasonId),
  title: "Klasyfikatorzy",
  noSeasonMessage: "Wybierz sezon, aby zarządzać klasyfikatorami.",
  emptyMessage: "Brak zapisanych klasyfikatorów. Dodaj pierwszą osobę, aby uruchomić egzaminy.",
  emptyActionLabel: "Dodaj Klasyfikatora",
  dialogTitles: {
    add: "Dodaj Klasyfikatora",
    edit: "Edytuj Klasyfikatora",
  },
  deleteDialogTitle: "Usuń klasyfikatora",
  messages: {
    loadError: "Nie udało się pobrać klasyfikatorów",
    loadFallback: "Wystąpił błąd podczas pobierania klasyfikatorów",
    createError: "Nie udało się dodać klasyfikatora",
    createFallback: "Wystąpił błąd podczas zapisu klasyfikatora",
    updateError: "Nie udało się zaktualizować klasyfikatora",
    updateFallback: "Wystąpił błąd podczas zapisu klasyfikatora",
    deleteError: "Nie udało się usunąć klasyfikatora",
    deleteFallback: "Wystąpił błąd podczas usuwania",
  },
};

interface PersonnelTabProps {
  seasonId: string;
  config: PersonnelConfig;
}

function PersonnelTab({ seasonId, config }: PersonnelTabProps) {
  const queryClient = useQueryClient();
  const {
    apiEndpoint,
    queryKey,
    title,
    noSeasonMessage,
    emptyMessage,
    emptyActionLabel,
    dialogTitles,
    deleteDialogTitle,
    messages,
  } = config;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Person | null>(null);

  const invalidateList = () => {
    if (!seasonId) return;
    void queryClient.invalidateQueries({ queryKey: queryKey(seasonId) });
  };

  const {
    data: people = [],
    isPending: loading,
    isError,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: queryKey(seasonId || "__none__"),
    queryFn: ({ signal }) => {
      if (!seasonId) return Promise.reject(new Error("Brak sezonu"));
      return fetchPersonnelBySeason(apiEndpoint, seasonId, messages.loadError, signal);
    },
    enabled: Boolean(seasonId),
  });

  const createMutation = useMutation({
    mutationFn: async (payload: PersonFormPayload) => {
      if (!seasonId) throw new Error("Brak sezonu");
      const requestBody = {
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phone: payload.phone,
        seasonId,
      };
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        const message = await parseFormErrorFromResponse(response, messages.createError);
        throw new Error(message);
      }
      return response.json() as Promise<Person>;
    },
    onSuccess: () => {
      invalidateList();
      setDialogOpen(false);
      setEditingPerson(null);
      setDialogError(null);
    },
    onError: (e: unknown) => {
      setDialogError(e instanceof Error ? e.message : messages.createFallback);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: PersonFormPayload }) => {
      const response = await fetch(`${apiEndpoint}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email,
          phone: payload.phone,
        }),
      });
      if (!response.ok) {
        const message = await parseFormErrorFromResponse(response, messages.updateError);
        throw new Error(message);
      }
      return response.json() as Promise<Person>;
    },
    onSuccess: () => {
      invalidateList();
      setDialogOpen(false);
      setEditingPerson(null);
      setDialogError(null);
    },
    onError: (e: unknown) => {
      setDialogError(e instanceof Error ? e.message : messages.updateFallback);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${apiEndpoint}/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const message = await parseFormErrorFromResponse(response, messages.deleteError);
        throw new Error(message);
      }
    },
    onSuccess: () => {
      invalidateList();
      setDeleteTarget(null);
    },
  });

  const submitting = createMutation.isPending || updateMutation.isPending;

  const handleAddClick = () => {
    setEditingPerson(null);
    setDialogError(null);
    createMutation.reset();
    updateMutation.reset();
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setDialogError(null);
    setEditingPerson(null);
    createMutation.reset();
    updateMutation.reset();
  };

  const handleDialogSubmit = (payload: PersonFormPayload) => {
    if (editingPerson) {
      updateMutation.mutate({ id: editingPerson.id, payload });
      return;
    }
    createMutation.mutate(payload);
  };

  const handleEditClick = (person: Person) => {
    setEditingPerson(person);
    setDialogError(null);
    createMutation.reset();
    updateMutation.reset();
    setDialogOpen(true);
  };

  const handleDeleteClick = (person: Person) => {
    deleteMutation.reset();
    setDeleteTarget(person);
  };

  const handleDeleteConfirmed = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
  };

  const loadError = isError && queryError instanceof Error ? queryError.message : null;

  if (!seasonId) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        {noSeasonMessage}
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (loadError) {
    return <DataLoadAlert message={loadError} onRetry={() => void refetch()} />;
  }

  return (
    <>
      {deleteMutation.isError && deleteMutation.error instanceof Error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {deleteMutation.error.message}
        </Alert>
      ) : null}
      {people.length === 0 && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={handleAddClick}>
              {emptyActionLabel}
            </Button>
          }
        >
          {emptyMessage}
        </Alert>
      )}
      <PersonnelTable
        title={title}
        data={people}
        onAddClick={handleAddClick}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        deletingId={deleteMutation.isPending ? (deleteTarget?.id ?? null) : null}
      />
      <AddPersonDialog
        open={dialogOpen}
        loading={submitting}
        error={dialogError}
        dialogTitle={editingPerson ? dialogTitles.edit : dialogTitles.add}
        submitLabel={editingPerson ? "Aktualizuj" : "Zapisz"}
        initialValues={
          editingPerson
            ? {
                firstName: editingPerson.firstName,
                lastName: editingPerson.lastName,
                email: editingPerson.email ?? "",
                phone: editingPerson.phone ? String(editingPerson.phone) : "",
              }
            : undefined
        }
        onClose={handleDialogClose}
        onSubmit={handleDialogSubmit}
      />
      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        onClose={() => {
          setDeleteTarget(null);
          deleteMutation.reset();
        }}
        onConfirm={handleDeleteConfirmed}
        loading={deleteMutation.isPending}
        title={deleteDialogTitle}
        description={
          <DialogContentText>
            Czy na pewno chcesz usunąć{" "}
            <strong>
              {deleteTarget?.firstName} {deleteTarget?.lastName}
            </strong>
            ? Operacja jest nieodwracalna.
          </DialogContentText>
        }
      />
    </>
  );
}

function RefereesTab({ seasonId }: { seasonId: string }) {
  return <PersonnelTab seasonId={seasonId} config={REFEREES_CONFIG} />;
}

function ClassifiersTab({ seasonId }: { seasonId: string }) {
  return <PersonnelTab seasonId={seasonId} config={CLASSIFIERS_CONFIG} />;
}
function PersonnelTable({ title, data, onAddClick, onEdit, onDelete, deletingId }: PersonnelTableProps) {
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          {title}
        </Typography>
        <Button variant="contained" size="small" onClick={onAddClick}>
          + Dodaj Osobę
        </Button>
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "grey.100" }}>
              <TableCell sx={{ fontWeight: "bold" }}>Imię i Nazwisko</TableCell>
              <TableCell sx={{ fontWeight: "bold", textAlign: "center" }}>Email</TableCell>
              <TableCell sx={{ fontWeight: "bold", textAlign: "center" }}>Telefon</TableCell>
              <TableCell sx={{ fontWeight: "bold", textAlign: "center" }}>Operacje</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell>
                  {p.firstName} {p.lastName}
                </TableCell>
                <TableCell align="center">{p.email ?? "-"}</TableCell>
                <TableCell align="center">{p.phone ?? "-"}</TableCell>
                <TableCell align="center">
                  <Button size="small" color="primary" onClick={() => onEdit?.(p)} disabled={!onEdit}>
                    Edytuj
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => onDelete?.(p)}
                    disabled={!onDelete || deletingId === p.id}
                  >
                    {deletingId === p.id ? "Usuwanie..." : "Usuń"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

interface PersonFormFields {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

const personDialogInitialState: PersonFormFields = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
};

interface AddPersonDialogProps {
  open: boolean;
  loading: boolean;
  error: string | null;
  dialogTitle: string;
  submitLabel?: string;
  initialValues?: PersonFormFields;
  onClose: () => void;
  onSubmit: (payload: PersonFormPayload) => void;
}

// Dialog that collects name and contact details before hitting the API.
export function AddPersonDialog({
  open,
  loading,
  error,
  dialogTitle,
  submitLabel,
  initialValues,
  onClose,
  onSubmit,
}: AddPersonDialogProps) {
  const [form, setForm] = useState<PersonFormFields>(personDialogInitialState);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(initialValues ?? personDialogInitialState);
    setLocalError(null);
  }, [open, initialValues]);

  const handleChange = (field: keyof PersonFormFields) => (event: ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    setForm((current) => ({ ...current, [field]: rawValue }));
  };

  const handlePhoneChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, phone: sanitizePhone(event.target.value) }));
  };

  const handleSave = () => {
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    if (!firstName || !lastName) {
      setLocalError("Imię i nazwisko są wymagane");
      return;
    }
    if (firstName.length > MAX_SHORT_TEXT || lastName.length > MAX_SHORT_TEXT) {
      setLocalError(`Imię i nazwisko nie mogą przekraczać ${MAX_SHORT_TEXT} znaków`);
      return;
    }
    const email = form.email.trim();
    if (email && email.length > MAX_SHORT_TEXT) {
      setLocalError(`Email nie może przekraczać ${MAX_SHORT_TEXT} znaków`);
      return;
    }
    const phone = form.phone.trim();
    if (phone && phone.length !== 9) {
      setLocalError("Numer telefonu musi zawierać dokładnie 9 cyfr");
      return;
    }
    setLocalError(null);
    // Send null (not undefined) so the API explicitly clears the field
    onSubmit({
      firstName,
      lastName,
      email: email || null,
      phone: phone || null,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          {localError && <Alert severity="error">{localError}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Imię" value={form.firstName} onChange={handleChange("firstName")} />
          <TextField label="Nazwisko" value={form.lastName} onChange={handleChange("lastName")} />
          <TextField label="Email" type="email" value={form.email} onChange={handleChange("email")} />
          <TextField
            label="Telefon"
            placeholder="9 cyfr"
            inputMode="numeric"
            value={form.phone}
            onChange={handlePhoneChange}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Anuluj
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}>
          {loading ? <CircularProgress size={18} /> : (submitLabel ?? "Zapisz")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
