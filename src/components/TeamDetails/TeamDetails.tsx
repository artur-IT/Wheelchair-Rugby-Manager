import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
  Link as MuiLink,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import AppShell from "@/components/AppShell/AppShell";
import { MOCK_TEAMS } from "@/mockData";

interface TeamDetailsProps {
  id: string;
}

export default function TeamDetails({ id }: TeamDetailsProps) {
  return (
    <ThemeRegistry>
      <AppShell currentPath="/settings">
        <TeamDetailsContent id={id} />
      </AppShell>
    </ThemeRegistry>
  );
}

function TeamDetailsContent({ id }: TeamDetailsProps) {
  const team = MOCK_TEAMS.find((t) => t.id === id);

  if (!team) {
    return <Typography>Nie znaleziono drużyny.</Typography>;
  }

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
            href="/settings"
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
            &larr; Powrót do ustawień
          </MuiLink>
          <Typography variant="h3" sx={{ fontWeight: 900 }}>
            {team.name}
          </Typography>
          <Typography color="textSecondary">{team.address}</Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button variant="outlined" color="error" sx={{ borderRadius: 4, fontWeight: "bold" }}>
            Usuń Drużynę
          </Button>
          <Button variant="contained" sx={{ borderRadius: 4, fontWeight: "bold" }}>
            Edytuj Dane
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
          <Paper sx={{ p: 4, borderRadius: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Zawodnicy
              </Typography>
              <Button size="small" color="primary">
                + Dodaj Zawodnika
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "grey.100" }}>
                    <TableCell sx={{ fontWeight: "bold" }}>Imię i Nazwisko</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Klasyfikacja</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>
                      Akcje
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {team.players.map((p) => (
                    <TableRow key={p.id} hover>
                      <TableCell>
                        {p.firstName} {p.lastName}
                      </TableCell>
                      <TableCell>
                        <Chip label={p.classification.toFixed(1)} size="small" variant="outlined" />
                      </TableCell>
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
          </Paper>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
              Kontakt
            </Typography>
            <Typography sx={{ fontWeight: "bold" }}>
              {team.contactPerson.firstName} {team.contactPerson.lastName}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {team.contactPerson.email}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {team.contactPerson.phone}
            </Typography>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
              Trener & Staff
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    color: "text.secondary",
                    mb: 0.5,
                    display: "block",
                  }}
                >
                  Trener
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {team.coach ? `${team.coach.firstName} ${team.coach.lastName}` : "Nie przypisano"}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    color: "text.secondary",
                    mb: 0.5,
                    display: "block",
                  }}
                >
                  Staff
                </Typography>
                {team.staff.length > 0 ? (
                  team.staff.map((s) => (
                    <Typography key={s.id} variant="body2" sx={{ fontWeight: 500 }}>
                      {s.firstName} {s.lastName}
                    </Typography>
                  ))
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    Brak personelu
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
