import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { assignLocation } from "@/lib/navigation/assignLocation";

interface Props {
  open: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

export default function LoginModal({ open, onClose, onLoginSuccess }: Props) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthNotice, setOauthNotice] = useState<string | null>(null);
  const [registeredNotice, setRegisteredNotice] = useState(false);
  const handleLoginSuccess = onLoginSuccess ?? (() => (window.location.href = "/dashboard"));

  useEffect(() => {
    if (!open) return;
    const params = new URLSearchParams(window.location.search);
    if (params.has("registered")) setRegisteredNotice(true);
    if (params.get("oauth") === "unconfigured") {
      setOauthNotice(
        "Logowanie Google nie jest skonfigurowane (brak zmiennych GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)."
      );
    } else if (params.get("oauth_error")) {
      setOauthNotice("Logowanie Google nie powiodło się. Spróbuj ponownie.");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(false);
    setLoading(true);

    const form = e.currentTarget;
    const localLogin = String(new FormData(form).get("localLogin") ?? "").trim();
    const password = String(new FormData(form).get("password") ?? "");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ localLogin, password }),
      });
      const data = (await res.json()) as { ok?: boolean; mustResetPassword?: boolean };

      if (data.ok) {
        if (data.mustResetPassword) {
          assignLocation("/reset-password");
          return;
        }
        handleLoginSuccess();
        return;
      }
    } catch {
      // Ignore network errors and show generic message.
    } finally {
      setLoading(false);
    }

    setError(true);
  };

  const startGoogle = () => {
    window.location.href = "/api/auth/google/start";
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        Logowanie
        <IconButton aria-label="zamknij" onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <Alert severity="info">
            <strong>Dwa osobne konta:</strong> konto z nickiem w aplikacji i konto przez Google to dwie różne tożsamości
            — nie łączymy ich w jedno.
          </Alert>
          {registeredNotice && (
            <Alert severity="success" onClose={() => setRegisteredNotice(false)}>
              Konto utworzone. Zaloguj się nickiem i hasłem.
            </Alert>
          )}
          {oauthNotice && (
            <Alert severity="warning" onClose={() => setOauthNotice(null)}>
              {oauthNotice}
            </Alert>
          )}

          <Button type="button" variant="outlined" fullWidth onClick={startGoogle}>
            Zaloguj przez Google
          </Button>

          <Divider>lub </Divider>

          {error && <Alert severity="error">Błędny nick lub hasło. Spróbuj ponownie.</Alert>}

          <Box component="form" onSubmit={(e) => void handleSubmit(e)}>
            <TextField
              name="localLogin"
              label="Nick (login)"
              autoComplete="username"
              required
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              name="password"
              label="Hasło"
              type="password"
              autoComplete="current-password"
              required
              fullWidth
              sx={{ mb: 2 }}
            />
            <Button type="submit" variant="contained" fullWidth disabled={loading}>
              {loading ? "Logowanie…" : "Zaloguj nickiem"}
            </Button>
          </Box>

          <Typography variant="body2" sx={{ textAlign: "center" }}>
            Nie masz konta w aplikacji?{" "}
            <Link href="/register" onClick={onClose}>
              Załóż konto
            </Link>
          </Typography>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
