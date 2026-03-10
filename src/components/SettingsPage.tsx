import { useState, useEffect } from "react";
import type { ReactElement } from "react";
import { Users, UserCircle, ChevronRight, Pencil } from "lucide-react";
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
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import { Trash2 } from "lucide-react";
import type { Season } from "@/types";
import ThemeRegistry from "@/components/ThemeRegistry";
import AppShell from "@/components/AppShell";
import { MOCK_TEAMS, MOCK_REFEREES, MOCK_CLASSIFIERS, MOCK_VOLUNTEERS } from "@/mockData";

type TabValue = "teams" | "referees" | "classifiers" | "volunteers";

export default function SettingsPage() {
  return (
    <ThemeRegistry>
      <AppShell currentPath="/settings">
        <SettingsContent />
      </AppShell>
    </ThemeRegistry>
  );
}

function StyledTab({ label, value, icon }: { label: string; value: string; icon: ReactElement }) {
  return <Tab label={label} value={value} icon={icon} iconPosition="start" />;
}

function SeasonsManager() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all seasons on mount
  useEffect(() => {
    fetch("/api/seasons")
      .then((r) => r.json())
      .then((data: Season[]) => {
        setSeasons(data);
        if (data.length > 0) setSelectedId(data[0].id);
      })
      .catch(() => setError("Nie udało się pobrać sezonów"))
      .finally(() => setLoaded(true));
  }, []);

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

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", mb: 0.5 }}>
          Ustawienia Sezonu
        </Typography>
        <Typography color="textSecondary">Zarządzaj globalnymi danymi ligi.</Typography>
      </Box>
      <SeasonsManager />

      <Paper sx={{ borderRadius: 3 }}>
        <Tabs value={activeTab} onChange={(_, v: TabValue) => setActiveTab(v)} variant="fullWidth">
          <StyledTab label="Drużyny" value="teams" icon={<Users size={18} />} />
          <StyledTab label="Sędziowie" value="referees" icon={<UserCircle size={18} />} />
          <StyledTab label="Klasyfikatorzy" value="classifiers" icon={<UserCircle size={18} />} />
        </Tabs>

        <CardContent sx={{ minHeight: 400 }}>
          {activeTab === "teams" && <TeamsTab />}
          {activeTab !== "teams" && <PersonnelTab activeTab={activeTab} />}
        </CardContent>
      </Paper>
    </Box>
  );
}

function TeamsTab() {
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
        {MOCK_TEAMS.map((team) => (
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
                <Avatar sx={{ bgcolor: "primary.main" }}>{team.name[0]}</Avatar>
                <Box>
                  <Typography sx={{ fontWeight: "bold" }}>{team.name}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {team.players.length} zawodników
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

function PersonnelTab({ activeTab }: { activeTab: TabValue }) {
  const data =
    activeTab === "referees" ? MOCK_REFEREES : activeTab === "classifiers" ? MOCK_CLASSIFIERS : MOCK_VOLUNTEERS;

  const title =
    activeTab === "referees" ? "Sędziowie" : activeTab === "classifiers" ? "Klasyfikatorzy" : "Wolontariusze";

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
        <Button variant="contained" size="small">
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
                <TableCell>{p.email}</TableCell>
                <TableCell>{p.phone}</TableCell>
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
