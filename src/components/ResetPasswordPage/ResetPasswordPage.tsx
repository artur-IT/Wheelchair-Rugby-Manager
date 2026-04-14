import { useCallback, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Alert, Box, Button, Container, Link, Paper, Stack, TextField, Typography } from "@mui/material";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import { CompletePasswordResetBodySchema, InitialLocalPasswordBodySchema } from "@/lib/auth/schemas";

type Status = "loading" | "ready";

interface InitialFormValues {
  localLogin: string;
  password: string;
}

interface ResetFormValues {
  password: string;
}

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [loggedIn, setLoggedIn] = useState(false);
  const [mustResetPassword, setMustResetPassword] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const initialForm = useForm<InitialFormValues>({
    resolver: zodResolver(InitialLocalPasswordBodySchema),
    defaultValues: { localLogin: "", password: "" },
  });

  const resetForm = useForm<ResetFormValues>({
    resolver: zodResolver(CompletePasswordResetBodySchema),
    defaultValues: { password: "" },
  });

  const loadStatus = useCallback(async () => {
    setStatusError(null);
    let skipReady = false;
    try {
      const res = await fetch("/api/auth/password-reset-status", { credentials: "include" });
      const data = (await res.json()) as { loggedIn?: boolean; mustResetPassword?: boolean };
      setLoggedIn(Boolean(data.loggedIn));
      setMustResetPassword(Boolean(data.mustResetPassword));
      if (data.loggedIn && !data.mustResetPassword) {
        window.location.assign("/dashboard");
        skipReady = true;
        return;
      }
    } catch {
      setStatusError("Nie udało się sprawdzić stanu konta.");
    } finally {
      if (!skipReady) setStatus("ready");
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const onInitialSubmit = initialForm.handleSubmit(async (values) => {
    try {
      const res = await fetch("/api/auth/initial-local-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        initialForm.setError("root", { message: data.error ?? "Nie udało się zapisać hasła." });
        return;
      }
      initialForm.reset();
      window.location.assign("/?login=1&password_set=1");
    } catch {
      initialForm.setError("root", { message: "Błąd sieci. Spróbuj ponownie." });
    }
  });

  const onResetSubmit = resetForm.handleSubmit(async (values) => {
    try {
      const res = await fetch("/api/auth/complete-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        resetForm.setError("root", { message: data.error ?? "Nie udało się zapisać hasła." });
        return;
      }
      window.location.assign("/dashboard");
    } catch {
      resetForm.setError("root", { message: "Błąd sieci. Spróbuj ponownie." });
    }
  });

  return (
    <ThemeRegistry>
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Hasło konta
          </Typography>
          {status === "loading" && <Typography>Wczytywanie…</Typography>}
          {statusError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {statusError}
            </Alert>
          )}
          {status === "ready" && loggedIn && mustResetPassword && (
            <Box component="form" onSubmit={(e) => void onResetSubmit(e)}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Musisz ustalić nowe hasło zanim przejdziesz dalej w aplikacji.
              </Alert>
              {resetForm.formState.errors.root && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {resetForm.formState.errors.root.message}
                </Alert>
              )}
              <TextField
                label="Nowe hasło"
                type="password"
                autoComplete="new-password"
                fullWidth
                sx={{ mb: 2 }}
                {...resetForm.register("password")}
                error={Boolean(resetForm.formState.errors.password)}
                helperText={resetForm.formState.errors.password?.message}
              />
              <Button type="submit" variant="contained" fullWidth disabled={resetForm.formState.isSubmitting}>
                {resetForm.formState.isSubmitting ? "Zapisywanie…" : "Zapisz nowe hasło"}
              </Button>
            </Box>
          )}
          {status === "ready" && !(loggedIn && mustResetPassword) && (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                Jeśli Twoje konto zostało przeniesione z wcześniejszej wersji bazy i nie masz jeszcze hasła w tej
                aplikacji, ustaw je poniżej (nick taki jak przy logowaniu).
              </Typography>
              {initialForm.formState.errors.root && (
                <Alert severity="error">{initialForm.formState.errors.root.message}</Alert>
              )}
              <Box component="form" onSubmit={(e) => void onInitialSubmit(e)}>
                <TextField
                  label="Nick (login)"
                  autoComplete="username"
                  fullWidth
                  sx={{ mb: 2 }}
                  {...initialForm.register("localLogin")}
                  error={Boolean(initialForm.formState.errors.localLogin)}
                  helperText={initialForm.formState.errors.localLogin?.message}
                />
                <TextField
                  label="Nowe hasło"
                  type="password"
                  autoComplete="new-password"
                  fullWidth
                  sx={{ mb: 2 }}
                  {...initialForm.register("password")}
                  error={Boolean(initialForm.formState.errors.password)}
                  helperText={initialForm.formState.errors.password?.message}
                />
                <Button type="submit" variant="contained" fullWidth disabled={initialForm.formState.isSubmitting}>
                  {initialForm.formState.isSubmitting ? "Zapisywanie…" : "Ustaw hasło"}
                </Button>
              </Box>
              <Typography variant="body2" sx={{ textAlign: "center" }}>
                <Link href="/">Wróć na stronę główną</Link>
              </Typography>
            </Stack>
          )}
        </Paper>
      </Container>
    </ThemeRegistry>
  );
}
