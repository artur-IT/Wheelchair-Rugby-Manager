import { useState } from "react";
import type { ReactElement } from "react";
import { Users, UserCircle, ChevronRight } from "lucide-react";
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
} from "@mui/material";
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

      <Paper sx={{ borderRadius: 3 }}>
        <Tabs value={activeTab} onChange={(_, v: TabValue) => setActiveTab(v)} variant="fullWidth">
          <StyledTab label="Drużyny" value="teams" icon={<Users size={18} />} />
          <StyledTab label="Sędziowie" value="referees" icon={<UserCircle size={18} />} />
          <StyledTab label="Klasyfikatorzy" value="classifiers" icon={<UserCircle size={18} />} />
          <StyledTab label="Wolontariusze" value="volunteers" icon={<UserCircle size={18} />} />
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
