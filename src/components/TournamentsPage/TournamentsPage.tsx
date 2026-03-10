import { Plus, Calendar, MapPin } from "lucide-react";
import { motion } from "motion/react";
import { Box, Button, Grid, Card, CardContent, Typography, Chip } from "@mui/material";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import AppShell from "@/components/AppShell/AppShell";
import { MOCK_TOURNAMENTS } from "@/mockData";

export default function TournamentsPage() {
  return (
    <ThemeRegistry>
      <AppShell currentPath="/tournaments">
        <TournamentsContent />
      </AppShell>
    </ThemeRegistry>
  );
}

function TournamentsContent() {
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: "bold", mb: 0.5 }}>
            Turnieje
          </Typography>
          <Typography color="textSecondary">Zarządzaj wydarzeniami w tym sezonie.</Typography>
        </Box>
        <Button component="a" href="/tournaments/new" variant="contained" startIcon={<Plus size={20} />}>
          Nowy Turniej
        </Button>
      </Box>

      <Grid container spacing={3}>
        {MOCK_TOURNAMENTS.map((t) => (
          <Grid size={{ xs: 12, md: 6, lg: 4 }} key={t.id}>
            <motion.div whileHover={{ y: -5 }}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 3,
                }}
              >
                <CardContent sx={{ flex: 1 }}>
                  <Chip label="Nadchodzący" color="primary" size="small" sx={{ mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                    {t.name}
                  </Typography>
                  <Box>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <Calendar size={16} />
                      <Typography variant="body2" color="textSecondary">
                        {t.startDate} - {t.endDate}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <MapPin size={16} />
                      <Typography variant="body2" color="textSecondary">
                        {t.venue.name}, {t.venue.address}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
                <Box sx={{ p: 1.5, display: "flex", gap: 1 }}>
                  <Button component="a" href={`/tournaments/${t.id}`} variant="outlined" fullWidth size="small">
                    Szczegóły
                  </Button>
                  <Button component="a" href={`/tournaments/${t.id}/edit`} variant="contained" fullWidth size="small">
                    Edytuj
                  </Button>
                </Box>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
