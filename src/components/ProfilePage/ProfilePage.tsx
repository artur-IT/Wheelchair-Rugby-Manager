import { UserCircle } from "lucide-react";
import { Box, Button, Grid, TextField, Typography, Paper, Avatar } from "@mui/material";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import AppShell from "@/components/AppShell/AppShell";

export default function ProfilePage() {
  return (
    <ThemeRegistry>
      <AppShell currentPath="/profile">
        <ProfileContent />
      </AppShell>
    </ThemeRegistry>
  );
}

function ProfileContent() {
  return (
    <Paper sx={{ p: 4, maxWidth: 500, mx: "auto", borderRadius: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: "bold", mb: 3 }}>
        Mój Profil
      </Typography>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 3,
          pb: 3,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Avatar sx={{ width: 80, height: 80, bgcolor: "primary.main" }}>
          <UserCircle size={64} />
        </Avatar>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Administrator Systemu
          </Typography>
          <Typography variant="body2" color="textSecondary">
            inz.matys@gmail.com
          </Typography>
        </Box>
      </Box>
      <form>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth label="Imię" defaultValue="Admin" required />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth label="Nazwisko" defaultValue="Systemu" required />
          </Grid>
        </Grid>
        <Button variant="contained" fullWidth sx={{ mt: 3 }}>
          Zapisz Zmiany
        </Button>
      </form>
    </Paper>
  );
}
