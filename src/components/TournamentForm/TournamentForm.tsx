import { Box, Button, Grid, TextField, Typography, Paper, Divider } from "@mui/material";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import AppShell from "@/components/AppShell/AppShell";

export default function TournamentForm() {
  return (
    <ThemeRegistry>
      <AppShell currentPath="/tournaments">
        <TournamentFormContent />
      </AppShell>
    </ThemeRegistry>
  );
}

function TournamentFormContent() {
  return (
    <Paper sx={{ p: 4, maxWidth: 600, mx: "auto", borderRadius: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: "bold", mb: 3 }}>
        Nowy / Edytuj Turniej
      </Typography>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          window.location.href = "/tournaments";
        }}
      >
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField required fullWidth label="Nazwa Turnieju" placeholder="np. Turniej Jesienny" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth label="Wyżywienie" placeholder="np. Catering na hali" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              required
              fullWidth
              type="date"
              label="Data Rozpoczęcia"
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              required
              fullWidth
              type="date"
              label="Data Zakończenia"
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2 }}>
          Lokalizacja
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField required fullWidth label="Nazwa Hali" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField required fullWidth label="Adres Hali" />
          </Grid>
          <Grid size={12}>
            <TextField fullWidth type="url" label="Link do Mapy (Hala)" />
          </Grid>
        </Grid>

        <Box sx={{ display: "flex", gap: 2, pt: 2 }}>
          <Button variant="outlined" fullWidth component="a" href="/tournaments">
            Anuluj
          </Button>
          <Button variant="contained" type="submit" fullWidth>
            Zapisz Turniej
          </Button>
        </Box>
      </form>
    </Paper>
  );
}
