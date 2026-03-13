import { useState, useEffect } from "react";
import type { ChangeEvent, ReactElement } from "react";
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
import type { SelectChangeEvent } from "@mui/material";
import { Trash2 } from "lucide-react";
import type { Season, Team, Person, CreateRefereeDto, CreateClassifierDto } from "@/types";
import { useDefaultSeason } from "@/components/hooks/useDefaultSeason";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import AppShell from "@/components/AppShell/AppShell";

type TabValue = "teams" | "referees" | "classifiers";

export default function SettingsPage() {
  return (
    <ThemeRegistry>
      <AppShell currentPath="/settings">
        <SettingsContent />
      </AppShell>
    </ThemeRegistry>
  );
}

function StyledTab({
  label,
  value,
  icon,
  onClick,
}: {
  label: string;
  value: string;
  icon: ReactElement;
  onClick?: () => void;
}) {
  return <Tab label={label} value={value} icon={icon} iconPosition="start" onClick={onClick} />;
}

function SeasonsManager({ onSeasonChange }: { onSeasonChange: (seasonId: string) => void }) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { defaultSeasonId, saveDefault } = useDefaultSeason();

  // Fetch seasons; pre-select the saved default or first season
  useEffect(() => {
    fetch("/api/seasons")
      .then((r) => r.json())
      .then((data: Season[]) => {
        setSeasons(data);
        if (data.length === 0) return;
        const savedExists = data.some((s) => s.id === defaultSeasonId);
        setSelectedId(savedExists ? (defaultSeasonId as string) : data[0].id);
      })
      .catch(() => setError("Nie udało się pobrać sezonów"))
      .finally(() => setLoaded(true));
  }, [defaultSeasonId]);

  const handleDeleteConfirmed = async () => {
    setConfirmOpen(false);
    setDeleting(true);
    try {
      const res = await fetch(`/api/seasons/${selectedId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Nie udało się usunąć sezonu");
      const updated = seasons.filter((s) => s.id !== selectedId);
      setSeasons(updated);
      setSelectedId(updated[0]?.id ?? "");
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd usuwania");
    } finally {
      setDeleting(false);
    }
  };

  const selectedSeason = seasons.find((s) => s.id === selectedId);

  useEffect(() => {
    onSeasonChange(selectedId);
  }, [onSeasonChange, selectedId]);

  if (!loaded) return <CircularProgress size={20} sx={{ mb: 3 }} />;

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
          disabled={deleting || !selectedId}
          title="Usuń sezon"
        >
          {deleting ? <CircularProgress size={20} /> : <Trash2 size={18} />}
        </IconButton>

        {/* Add new season */}
        <Button variant="outlined" size="small" component="a" href="/settings/seasons/new">
          + Nowy sezon
        </Button>

        {error && (
          <Alert severity="error" sx={{ py: 0 }}>
            {error}
          </Alert>
        )}
      </Box>

      {/* Delete confirmation dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Usuń sezon</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Czy na pewno chcesz usunąć sezon <strong>{selectedSeason?.name}</strong>? Tej operacji nie można cofnąć.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Anuluj</Button>
          <Button color="error" variant="contained" onClick={handleDeleteConfirmed}>
            Usuń
          </Button>
        </DialogActions>
      </Dialog>
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
          <StyledTab label="Drużyny" value="teams" icon={<Users size={18} />} onClick={() => setActiveTab("teams")} />
          <StyledTab
            label="Sędziowie"
            value="referees"
            icon={<UserCircle size={18} />}
            onClick={() => setActiveTab("referees")}
          />
          <StyledTab
            label="Klasyfikatorzy"
            value="classifiers"
            icon={<UserCircle size={18} />}
            onClick={() => setActiveTab("classifiers")}
          />
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
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [teamsError, setTeamsError] = useState<string | null>(null);

  useEffect(() => {
    if (!seasonId) {
      setTeams([]);
      setLoadingTeams(false);
      setTeamsError(null);
      return;
    }

    const controller = new AbortController();

    async function fetchTeams() {
      setLoadingTeams(true);
      setTeamsError(null);
      try {
        const res = await fetch(`/api/teams?seasonId=${encodeURIComponent(seasonId)}`, { signal: controller.signal });
        if (!res.ok) throw new Error("Nie udało się pobrać drużyn");
        const data: Team[] = await res.json();
        setTeams(data);
      } catch (error) {
        if (controller.signal.aborted) return;
        setTeamsError(error instanceof Error ? error.message : "Wystąpił błąd podczas pobierania drużyn");
      } finally {
        if (!controller.signal.aborted) setLoadingTeams(false);
      }
    }

    fetchTeams();

    return () => controller.abort();
  }, [seasonId]);

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
    return <Alert severity="error">{teamsError}</Alert>;
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
  email?: string;
  phone?: string;
}

interface PersonnelTableProps {
  title: string;
  data: Person[];
  onAddClick: () => void;
}

function RefereesTab({ seasonId }: { seasonId: string }) {
  const [referees, setReferees] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Refresh referees whenever the selected season changes.
  useEffect(() => {
    if (!seasonId) {
      setReferees([]);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadReferees() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/referees?seasonId=${encodeURIComponent(seasonId)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Nie udało się pobrać sędziów");
        const data: Person[] = await response.json();
        if (!controller.signal.aborted) setReferees(data);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(loadError instanceof Error ? loadError.message : "Wystąpił błąd podczas pobierania sędziów");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadReferees();

    return () => controller.abort();
  }, [seasonId]);

  const handleAddClick = () => {
    setDialogError(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setDialogError(null);
  };

  const handleCreateReferee = async (payload: PersonFormPayload) => {
    if (!seasonId) return;
    setSubmitting(true);
    setDialogError(null);

    try {
      const requestBody: CreateRefereeDto = {
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phone: payload.phone,
        seasonId,
      };
      const response = await fetch("/api/referees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as {
          error?: { formErrors?: string[]; fieldErrors?: Record<string, string[]> };
        } | null;
        const fieldErrors = (errorBody?.error?.fieldErrors ?? {}) as Record<string, string[] | undefined>;
        const fieldMessages = Object.values(fieldErrors).reduce<string[]>((acc, errors) => {
          if (errors) acc.push(...errors);
          return acc;
        }, []);
        const message = errorBody?.error?.formErrors?.[0] ?? fieldMessages[0] ?? "Nie udało się dodać sędziego";
        throw new Error(message);
      }
      const created: Person = await response.json();
      setReferees((current) => [created, ...current]);
      setDialogOpen(false);
    } catch (submissionError) {
      setDialogError(
        submissionError instanceof Error ? submissionError.message : "Wystąpił błąd podczas zapisu sędziego"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!seasonId) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        Wybierz sezon, aby zarządzać sędziami.
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

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <>
      {referees.length === 0 && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={handleAddClick}>
              Dodaj Sędziego
            </Button>
          }
        >
          Brak zapisanych sędziów. Dodaj pierwszego sędziego, aby rozdzielać mecze.
        </Alert>
      )}
      <PersonnelTable title="Sędziowie" data={referees} onAddClick={handleAddClick} />
      <AddPersonDialog
        open={dialogOpen}
        loading={submitting}
        error={dialogError}
        title="Sędziego"
        onClose={handleDialogClose}
        onSubmit={handleCreateReferee}
      />
    </>
  );
}

function ClassifiersTab({ seasonId }: { seasonId: string }) {
  const [classifiers, setClassifiers] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Refresh classifiers whenever the selected season changes.
  useEffect(() => {
    if (!seasonId) {
      setClassifiers([]);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadClassifiers() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/classifiers?seasonId=${encodeURIComponent(seasonId)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Nie udało się pobrać klasyfikatorów");
        const data: Person[] = await response.json();
        if (!controller.signal.aborted) setClassifiers(data);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(loadError instanceof Error ? loadError.message : "Wystąpił błąd podczas pobierania klasyfikatorów");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadClassifiers();

    return () => controller.abort();
  }, [seasonId]);

  const handleAddClick = () => {
    setDialogError(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setDialogError(null);
  };

  const handleCreateClassifier = async (payload: PersonFormPayload) => {
    if (!seasonId) return;
    setSubmitting(true);
    setDialogError(null);

    try {
      const requestBody: CreateClassifierDto = {
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phone: payload.phone,
        seasonId,
      };
      const response = await fetch("/api/classifiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as {
          error?: { formErrors?: string[]; fieldErrors?: Record<string, string[]> };
        } | null;
        const fieldErrors = (errorBody?.error?.fieldErrors ?? {}) as Record<string, string[] | undefined>;
        const fieldMessages = Object.values(fieldErrors).reduce<string[]>((acc, errors) => {
          if (errors) acc.push(...errors);
          return acc;
        }, []);
        const message = errorBody?.error?.formErrors?.[0] ?? fieldMessages[0] ?? "Nie udało się dodać klasyfikatora";
        throw new Error(message);
      }
      const created: Person = await response.json();
      setClassifiers((current) => [created, ...current]);
      setDialogOpen(false);
    } catch (submissionError) {
      setDialogError(
        submissionError instanceof Error ? submissionError.message : "Wystąpił błąd podczas zapisu klasyfikatora"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!seasonId) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        Wybierz sezon, aby zarządzać klasyfikatorami.
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

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <>
      {classifiers.length === 0 && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={handleAddClick}>
              Dodaj Klasyfikatora
            </Button>
          }
        >
          Brak zapisanych klasyfikatorów. Dodaj pierwszą osobę, aby uruchomić egzaminy.
        </Alert>
      )}
      <PersonnelTable title="Klasyfikatorzy" data={classifiers} onAddClick={handleAddClick} />
      <AddPersonDialog
        open={dialogOpen}
        loading={submitting}
        error={dialogError}
        title="Klasyfikatora"
        onClose={handleDialogClose}
        onSubmit={handleCreateClassifier}
      />
    </>
  );
}

function PersonnelTable({ title, data, onAddClick }: PersonnelTableProps) {
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
              <TableCell sx={{ fontWeight: "bold" }}>Email</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Telefon</TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Akcje
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell>
                  {p.firstName} {p.lastName}
                </TableCell>
                <TableCell>{p.email ?? "-"}</TableCell>
                <TableCell>{p.phone ?? "-"}</TableCell>
                <TableCell align="right">
                  <Button size="small" color="primary">
                    Edytuj
                  </Button>
                  <Button size="small" color="error">
                    Usuń
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
  title: string;
  onClose: () => void;
  onSubmit: (payload: PersonFormPayload) => void;
}

// Dialog that collects name and contact details before hitting the API.
function AddPersonDialog({ open, loading, error, title, onClose, onSubmit }: AddPersonDialogProps) {
  const [form, setForm] = useState<PersonFormFields>(personDialogInitialState);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(personDialogInitialState);
    setLocalError(null);
  }, [open]);

  const sanitizePhone = (value: string) => value.replace(/\D/g, "").slice(0, 9);

  const handleChange = (field: keyof PersonFormFields) => (event: ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    const value = field === "phone" ? sanitizePhone(rawValue) : rawValue;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = () => {
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    if (!firstName || !lastName) {
      setLocalError("Imię i nazwisko są wymagane");
      return;
    }
    setLocalError(null);
    onSubmit({
      firstName,
      lastName,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Dodaj {title}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          {localError && <Alert severity="error">{localError}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Imię" value={form.firstName} onChange={handleChange("firstName")} />
          <TextField label="Nazwisko" value={form.lastName} onChange={handleChange("lastName")} />
          <TextField label="Email" type="email" value={form.email} onChange={handleChange("email")} />
          <TextField
            label="Telefon"
            type="tel"
            value={form.phone}
            onChange={handleChange("phone")}
            inputProps={{
              inputMode: "numeric",
              pattern: "^\\d{0,9}$",
              maxLength: 9,
              title: "Wprowadź maksymalnie 9 cyfr",
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Anuluj
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}>
          {loading ? <CircularProgress size={18} /> : "Zapisz"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
