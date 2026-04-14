import { useEffect, useState, type FormEvent } from "react";
import { UserCircle } from "lucide-react";
import { Box, Button, TextField, Typography, Paper, Avatar, CircularProgress, Alert } from "@mui/material";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import AppShell from "@/components/AppShell/AppShell";
import { useCurrentUser } from "@/components/AppShell/CurrentUserContext";
import { updateCurrentUserProfile } from "@/lib/api/me";

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
  const { status, user, refresh } = useCurrentUser();
  const [displayName, setDisplayName] = useState("");
  const [helperEmail, setHelperEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Keep the inputs aligned with the current profile fetched from context.
  const helperDefault = user ? (user.passwordResetEmail ?? user.email ?? "") : "";

  useEffect(() => {
    if (!user) {
      return;
    }
    setDisplayName(user.name);
    setHelperEmail(helperDefault);
    setError(null);
    setSuccess(null);
  }, [user?.name, helperDefault]);

  if (status === "loading") {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (status === "error" || !user) {
    return (
      <Alert severity="error" sx={{ maxWidth: 500, mx: "auto" }}>
        Nie udało się wczytać danych profilu. Odśwież stronę lub zaloguj się ponownie.
      </Alert>
    );
  }

  const trimmedHelperInput = helperEmail.trim();
  const normalizedHelper = trimmedHelperInput === "" ? "" : trimmedHelperInput.toLowerCase();
  const helperDirty = normalizedHelper !== helperDefault.toLowerCase();
  const displayNameDirty = displayName.trim() !== user.name;
  const canSave = (helperDirty || displayNameDirty) && !saving;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) {
      return;
    }

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setError("Wyświetlana nazwa nie może być pusta.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const helperInput = helperEmail.trim();
      // Send trimmed strings and treat an empty helper email as removal.
      await updateCurrentUserProfile({
        name: trimmedName,
        passwordResetEmail: helperInput === "" ? undefined : helperInput.toLowerCase(),
      });
      await refresh();
      setSuccess("Zapisano dane profilu.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zapisać zmian.");
    } finally {
      setSaving(false);
    }
  };

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
            {user.name}
          </Typography>
          {user.localLogin ? (
            <Typography variant="body2" color="textSecondary">
              Nick: {user.localLogin}
            </Typography>
          ) : (
            <Typography variant="body2" color="textSecondary">
              Logowanie przez Google
            </Typography>
          )}
          <Typography variant="body2" color="textSecondary">
            {user.email ?? "Brak adresu e-mail w koncie"}
          </Typography>
        </Box>
      </Box>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          label="Wyświetlana nazwa"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          required
        />
        <TextField
          label="Pomocniczy adres e-mail do resetu hasła"
          value={helperEmail}
          onChange={(event) => setHelperEmail(event.target.value)}
          helperText="Adres, którego użyjemy przy resetowaniu hasła. Zostaw puste, żeby go usunąć."
          type="email"
        />
        {error ? <Alert severity="error">{error}</Alert> : null}
        {success ? <Alert severity="success">{success}</Alert> : null}
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            aria-label="Anuluj zmiany"
            variant="outlined"
            color="secondary"
            disabled={(!displayNameDirty && !helperDirty) || saving}
            onClick={() => {
              setDisplayName(user.name);
              setHelperEmail(user.passwordResetEmail ?? user.email ?? "");
              setError(null);
              setSuccess(null);
            }}
            fullWidth
          >
            Anuluj
          </Button>
          <Button type="submit" variant="contained" fullWidth disabled={!canSave} size="large">
            {saving ? "Zapisuję..." : "Zapisz zmiany"}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
