import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Alert, Box, Button, Container, Link, Paper, Stack, TextField, Typography } from "@mui/material";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import { RegisterBodySchema } from "@/lib/auth/schemas";

interface RegisterFormValues {
  localLogin: string;
  password: string;
  email: string;
  name?: string;
}

export default function RegisterPage() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [postRegisterRedirect, setPostRegisterRedirect] = useState<string | null>(null);

  useEffect(() => {
    if (!postRegisterRedirect) return;
    window.location.assign(postRegisterRedirect);
  }, [postRegisterRedirect]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterBodySchema),
    defaultValues: { localLogin: "", password: "", email: "", name: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          localLogin: values.localLogin,
          password: values.password,
          email: values.email,
          ...(values.name?.trim() ? { name: values.name.trim() } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setSubmitError(data.error ?? "Nie udało się utworzyć konta.");
        return;
      }
      setPostRegisterRedirect("/?login=1&registered=1");
    } catch {
      setSubmitError("Błąd sieci. Sprawdź połączenie i spróbuj ponownie.");
    }
  });

  return (
    <ThemeRegistry>
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 4 }}>
        <Container maxWidth="xs">
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
              Rejestracja konta w aplikacji
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Konto z nickiem i hasłem jest <strong>oddzielne</strong> od konta „Zaloguj przez Google”. Dane i
              uprawnienia nie są wspólne.
            </Alert>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Nick jest zapisywany <strong>małymi literami</strong> (np. <code>Ab12</code> i <code>ab12</code> to ten
              sam nick).
            </Alert>
            <Alert severity="info" sx={{ mb: 2 }}>
              E-mail jest <strong>wymagany</strong> i przechowywany w bazie wyłącznie w celu resetu hasła.
            </Alert>
            {submitError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {submitError}
              </Alert>
            )}
            <Box component="form" onSubmit={onSubmit} noValidate>
              <Stack spacing={2}>
                <TextField
                  label="Nick (login)"
                  {...register("localLogin")}
                  error={Boolean(errors.localLogin)}
                  helperText={errors.localLogin?.message}
                  autoComplete="username"
                  required
                  fullWidth
                />
                <TextField
                  label="E-mail"
                  type="email"
                  {...register("email")}
                  error={Boolean(errors.email)}
                  helperText={errors.email?.message}
                  autoComplete="email"
                  required
                  fullWidth
                />
                <TextField
                  label="Wyświetlana nazwa (opcjonalnie)"
                  {...register("name")}
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message}
                  fullWidth
                />
                <TextField
                  label="Hasło"
                  type="password"
                  {...register("password")}
                  error={Boolean(errors.password)}
                  helperText={errors.password?.message}
                  autoComplete="new-password"
                  required
                  fullWidth
                />
                <Button type="submit" variant="contained" disabled={isSubmitting} fullWidth>
                  {isSubmitting ? "Tworzenie konta…" : "Załóż konto"}
                </Button>
                <Typography variant="body2" sx={{ textAlign: "center" }}>
                  <Link href="/">Wróć na stronę główną</Link>
                </Typography>
              </Stack>
            </Box>
          </Paper>
        </Container>
      </Box>
    </ThemeRegistry>
  );
}
