import { Trophy, Users, UserCircle, Calendar, ChevronRight, Plus } from "lucide-react";
import { Box, Button, Grid, Card, CardContent, Typography } from "@mui/material";
import ThemeRegistry from "@/components/ThemeRegistry";
import AppShell from "@/components/AppShell";
import { MOCK_TEAMS, MOCK_TOURNAMENTS, MOCK_REFEREES, MOCK_VOLUNTEERS } from "@/mockData";

const STATS = [
  {
    label: "Turnieje",
    value: MOCK_TOURNAMENTS.length,
    icon: Trophy,
    color: "#3b82f6",
  },
  {
    label: "Drużyny",
    value: MOCK_TEAMS.length,
    icon: Users,
    color: "#10b981",
  },
  {
    label: "Sędziowie",
    value: MOCK_REFEREES.length,
    icon: UserCircle,
    color: "#f59e0b",
  },
  {
    label: "Wolontariusze",
    value: MOCK_VOLUNTEERS.length,
    icon: UserCircle,
    color: "#8b5cf6",
  },
];

export default function Dashboard() {
  return (
    <ThemeRegistry>
      <AppShell currentPath="/dashboard">
        <DashboardContent />
      </AppShell>
    </ThemeRegistry>
  );
}

function DashboardContent() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
          Witaj, Organizatorze!
        </Typography>
        <Typography color="textSecondary">Oto podsumowanie Twojego sezonu.</Typography>
      </Box>

      <Grid container spacing={3}>
        {STATS.map((stat, i) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    bgcolor: stat.color,
                    p: 1.5,
                    borderRadius: 2,
                    color: "white",
                  }}
                >
                  <stat.icon size={20} />
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "text.secondary",
                    }}
                  >
                    {stat.label}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                    {stat.value}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  Nadchodzące Turnieje
                </Typography>
                <Button component="a" href="/tournaments" size="small">
                  Zobacz wszystkie
                </Button>
              </Box>
              <Box>
                {MOCK_TOURNAMENTS.map((t) => (
                  <Box
                    key={t.id}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      p: 2,
                      mb: 1,
                      bgcolor: "grey.50",
                      borderRadius: 1.5,
                      border: "1px solid",
                      borderColor: "grey.200",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Box sx={{ bgcolor: "white", p: 1, borderRadius: 1 }}>
                        <Calendar size={20} style={{ color: "#4f46e5" }} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: "bold" }}>{t.name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {t.startDate} - {t.endDate}
                        </Typography>
                      </Box>
                    </Box>
                    <ChevronRight size={20} style={{ color: "#cbd5e1" }} />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                Szybkie Akcje
              </Typography>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <Button
                    component="a"
                    href="/tournaments/new"
                    variant="outlined"
                    fullWidth
                    sx={{
                      borderStyle: "dashed",
                      py: 3,
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    <Plus size={24} />
                    <Typography variant="caption">Nowy Turniej</Typography>
                  </Button>
                </Grid>
                <Grid size={6}>
                  <Button
                    component="a"
                    href="/settings/teams/new"
                    variant="outlined"
                    fullWidth
                    sx={{
                      borderStyle: "dashed",
                      py: 3,
                      flexDirection: "column",
                      gap: 1,
                      color: "success.main",
                      borderColor: "success.main",
                      "&:hover": {
                        borderColor: "success.dark",
                        bgcolor: "success.50",
                      },
                    }}
                  >
                    <Plus size={24} />
                    <Typography variant="caption">Nowa Drużyna</Typography>
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
