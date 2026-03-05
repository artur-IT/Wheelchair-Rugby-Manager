import { Box, Button, Grid, TextField, Typography, Paper, Divider } from "@mui/material";
import ThemeRegistry from "@/components/ThemeRegistry";
import AppShell from "@/components/AppShell";

export default function TeamForm() {
  return (
    <ThemeRegistry>
      <AppShell currentPath="/settings">
        <TeamFormContent />
      </AppShell>
    </ThemeRegistry>
  );
}

function TeamFormContent() {
  return (
    <Paper sx={{ p: 4, maxWidth: 600, mx: "auto", borderRadius: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: "bold", mb: 3 }}>
        Nowa / Edytuj Drużynę
      </Typography>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          window.location.href = "/settings";
        }}
      >
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField required fullWidth label="Nazwa Drużyny" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField required fullWidth label="Adres" />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2 }}>
          Osoba do kontaktu
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField required fullWidth label="Imię" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField required fullWidth label="Nazwisko" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField required fullWidth type="email" label="Email" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField required fullWidth type="tel" label="Telefon" />
          </Grid>
        </Grid>

        <Box sx={{ display: "flex", gap: 2, pt: 2 }}>
          <Button variant="outlined" fullWidth component="a" href="/settings">
            Anuluj
          </Button>
          <Button variant="contained" color="success" type="submit" fullWidth>
            Zapisz Drużynę
          </Button>
        </Box>
      </form>
    </Paper>
  );
}
