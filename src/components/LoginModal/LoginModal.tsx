import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Alert,
  Box,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { signIn, signUp } from "supertokens-web-js/recipe/emailpassword";
import { getAuthorisationURLWithQueryParamsAndSetState } from "supertokens-web-js/recipe/thirdparty";
import { getOAuthRedirectOrigin } from "@/lib/browser/oauthRedirectOrigin";
import { ensureSuperTokensFrontendInitialized } from "@/lib/supertokens/initFrontend";

interface Props {
  open: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

type Mode = "signin" | "signup";

export default function LoginModal({ open, onClose, onLoginSuccess }: Props) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("signin");
  const handleLoginSuccess = onLoginSuccess ?? (() => (window.location.href = "/dashboard"));

  useEffect(() => {
    if (open) {
      ensureSuperTokensFrontendInitialized();
    }
  }, [open]);

  const startGoogle = async () => {
    setError(false);
    setLoading(true);
    try {
      ensureSuperTokensFrontendInitialized();
      const site = getOAuthRedirectOrigin();
      const frontendCallback = `${site}/auth/callback`;
      // Must match Google Cloud "Authorized redirect URIs" (GET is handled in api/auth/[...path].ts).
      const googleRedirectRegistered = `${site}/api/auth/callback/google`;
      const url = await getAuthorisationURLWithQueryParamsAndSetState({
        thirdPartyId: "google",
        frontendRedirectURI: frontendCallback,
        redirectURIOnProviderDashboard: googleRedirectRegistered,
      });
      window.location.assign(url);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(false);
    setLoading(true);

    const form = e.currentTarget;
    const email = String(new FormData(form).get("email") ?? "").trim();
    const password = String(new FormData(form).get("password") ?? "");

    try {
      ensureSuperTokensFrontendInitialized();
      const formFields = [
        { id: "email", value: email },
        { id: "password", value: password },
      ];

      const result = mode === "signin" ? await signIn({ formFields }) : await signUp({ formFields });

      if (result.status === "OK") {
        handleLoginSuccess();
        return;
      }
    } catch {
      // Network or unexpected errors
    } finally {
      setLoading(false);
    }

    setError(true);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        {mode === "signin" ? "Logowanie" : "Rejestracja"}
        <IconButton aria-label="zamknij" onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {mode === "signin"
              ? "Błędny email lub hasło. Spróbuj ponownie."
              : "Nie udało się utworzyć konta (email zajęty lub zbyt słabe hasło)."}
          </Alert>
        )}

        <Box sx={{ mb: 2 }}>
          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            value={mode}
            onChange={(_, v: Mode | null) => v && setMode(v)}
            aria-label="tryb konta"
          >
            <ToggleButton value="signin">Logowanie</ToggleButton>
            <ToggleButton value="signup">Nowe konto</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Button variant="outlined" fullWidth sx={{ mb: 2 }} onClick={() => void startGoogle()} disabled={loading}>
          Kontynuuj z Google
        </Button>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField name="email" label="Email" type="email" autoComplete="email" required fullWidth sx={{ mb: 2 }} />
          <TextField
            name="password"
            label="Hasło"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
            fullWidth
            sx={{ mb: 2 }}
          />
          <Button type="submit" variant="contained" fullWidth disabled={loading}>
            {loading ? "Przetwarzanie…" : mode === "signin" ? "Zaloguj" : "Utwórz konto"}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
