import { useState } from "react";
import { Dialog, DialogTitle, DialogContent, TextField, Button, Alert, Box, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface Props {
  open: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

export default function LoginModal({ open, onClose, onLoginSuccess }: Props) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleLoginSuccess = onLoginSuccess ?? (() => (window.location.href = "/dashboard"));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(false);
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        body: new FormData(e.currentTarget),
        headers: { Accept: "application/json" },
      });
      const data = await res.json();

      if (data.ok) {
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        Logowanie
        <IconButton aria-label="zamknij" onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Błędny email lub hasło. Spróbuj ponownie.
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
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
            {loading ? "Logowanie…" : "Zaloguj"}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
