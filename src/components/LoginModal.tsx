import { useState } from "react";
import { Dialog, DialogTitle, DialogContent, TextField, Button, Alert, Box, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function LoginModal({ open, onClose }: Props) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
        window.location.href = "/dashboard";
        return;
      }
    } catch {
      // network error — fall through to show error
    }

    setError(true);
    setLoading(false);
  }

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
            Błędny PIN / hasło. Spróbuj ponownie.
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            name="pin"
            label="PIN"
            type="password"
            autoComplete="current-password"
            required
            fullWidth
            autoFocus
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
