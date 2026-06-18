import { UserCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signOut } from "supertokens-web-js/recipe/session";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import AppShell from "@/components/AppShell/AppShell";
import { z } from "@/lib/zodPl";
import { deleteCurrentUserAccount, fetchCurrentUserProfile, updateCurrentUserProfile } from "@/lib/api/users";
import DataLoadAlert from "@/components/ui/DataLoadAlert";
import MutationErrorAlert from "@/components/ui/MutationErrorAlert";
import { focusFirstFieldError } from "@/lib/forms/focusFirstFieldError";
import { requiredFirstNameSchema, requiredLastNameSchema } from "@/lib/validateInputs";
import { ensureSuperTokensFrontendInitialized } from "@/lib/supertokens/initFrontend";

function emailsMatchForDeletion(typed: string, accountEmail: string): boolean {
  return typed.trim().toLowerCase() === accountEmail.trim().toLowerCase();
}

const profileSchema = z.object({
  firstName: requiredFirstNameSchema,
  lastName: requiredLastNameSchema,
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function ProfileContent() {
  const [email, setEmail] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveError, setSaveError] = useState<unknown>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [warnDeleteOpen, setWarnDeleteOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState("");
  const [deleteError, setDeleteError] = useState<unknown>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const {
    register,
    handleSubmit,
    setFocus,
    reset,
    formState: { errors, touchedFields, isSubmitted, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema as never),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: { firstName: "", lastName: "" },
  });

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const profile = await fetchCurrentUserProfile();
      setEmail(profile.email);
      reset({
        firstName: profile.firstName,
        lastName: profile.lastName,
      });
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Nie udało się pobrać danych użytkownika");
    } finally {
      setIsLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const onSubmit = async (values: ProfileFormValues) => {
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const updated = await updateCurrentUserProfile(values);
      setEmail(updated.email);
      reset({
        firstName: updated.firstName,
        lastName: updated.lastName,
      });
      setSaveSuccess(true);
    } catch (error) {
      setSaveError(error);
    }
  };

  const onInvalid = (invalidErrors: FieldErrors<ProfileFormValues>) => {
    setSaveSuccess(false);
    focusFirstFieldError(invalidErrors, setFocus);
  };

  if (isLoading) {
    return (
      <Paper sx={{ p: 4, maxWidth: 500, mx: "auto", borderRadius: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  if (loadError) {
    return (
      <Paper sx={{ p: 4, maxWidth: 500, mx: "auto", borderRadius: 3 }}>
        <DataLoadAlert message={loadError} onRetry={() => void loadProfile()} />
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 4, maxWidth: 500, mx: "auto", borderRadius: 3 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 3,
          pb: 3,
        }}
      >
        <Avatar sx={{ width: 80, height: 80, bgcolor: "primary.main" }}>
          <UserCircle size={64} />
        </Avatar>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Mój profil
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {email}
          </Typography>
        </Box>
      </Box>
      {saveError ? (
        <Box sx={{ mt: 2 }}>
          <MutationErrorAlert error={saveError} fallbackMessage="Nie udało się zapisać danych użytkownika." />
        </Box>
      ) : null}
      {saveSuccess ? (
        <Box sx={{ mt: 2 }}>
          <Alert severity="success">Dane profilu zostały zapisane.</Alert>
        </Box>
      ) : null}
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Imię"
              {...register("firstName")}
              error={Boolean((touchedFields.firstName || isSubmitted) && errors.firstName)}
              helperText={touchedFields.firstName || isSubmitted ? errors.firstName?.message : undefined}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Nazwisko"
              {...register("lastName")}
              error={Boolean((touchedFields.lastName || isSubmitted) && errors.lastName)}
              helperText={touchedFields.lastName || isSubmitted ? errors.lastName?.message : undefined}
            />
          </Grid>
        </Grid>
        <Button variant="contained" type="submit" fullWidth sx={{ mt: 3 }} disabled={isSubmitting}>
          {isSubmitting ? <CircularProgress size={24} color="inherit" /> : "Zapisz Zmiany"}
        </Button>
      </form>

      <Divider sx={{ my: 4 }} />
      <Typography variant="subtitle2" color="error" sx={{ fontWeight: "bold" }}>
        Strefa niebezpieczna
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Usunięcie konta jest na stałe. Znikną wszystkie powiązane dane: sezony, turnieje, drużyny oraz Mój Klub
        Sportowy.
      </Typography>
      <Button
        variant="outlined"
        color="error"
        sx={{ mt: 2 }}
        onClick={() => {
          setDeleteError(null);
          setWarnDeleteOpen(true);
        }}
      >
        Usuń konto
      </Button>

      <Dialog
        open={warnDeleteOpen}
        onClose={() => !deleteBusy && setWarnDeleteOpen(false)}
        aria-labelledby="delete-account-warn-title"
      >
        <DialogTitle id="delete-account-warn-title">Na pewno usunąć konto?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Tej operacji nie da się cofnąć. Stracisz dostęp do aplikacji, a wszystkie Twoje dane w systemie zostaną
            skasowane.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWarnDeleteOpen(false)} disabled={deleteBusy}>
            Anuluj
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              setWarnDeleteOpen(false);
              setDeletePhrase("");
              setDeleteError(null);
              setConfirmDeleteOpen(true);
            }}
            disabled={deleteBusy}
          >
            Tak, chcę kontynuować
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmDeleteOpen}
        onClose={() => !deleteBusy && setConfirmDeleteOpen(false)}
        aria-labelledby="delete-account-confirm-title"
      >
        <DialogTitle id="delete-account-confirm-title">Ostatnie potwierdzenie</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Wpisz swój adres e-mail używany do logowania (ten sam co w profilu). Możesz go skopiować z ramki poniżej.
          </Typography>
          <Typography
            variant="body2"
            sx={{
              mb: 1,
              fontFamily: "monospace",
              bgcolor: "action.hover",
              p: 1,
              borderRadius: 1,
              wordBreak: "break-all",
            }}
          >
            {email}
          </Typography>
          <TextField
            fullWidth
            label="Adres e-mail (login)"
            value={deletePhrase}
            onChange={(e) => setDeletePhrase(e.target.value)}
            disabled={deleteBusy}
            autoComplete="off"
          />
          {deleteError ? (
            <Box sx={{ mt: 2 }}>
              <MutationErrorAlert error={deleteError} fallbackMessage="Nie udało się usunąć konta." />
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setConfirmDeleteOpen(false);
              setDeletePhrase("");
            }}
            disabled={deleteBusy}
          >
            Anuluj
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleteBusy || !emailsMatchForDeletion(deletePhrase, email)}
            onClick={() => {
              void (async () => {
                setDeleteBusy(true);
                setDeleteError(null);
                try {
                  await deleteCurrentUserAccount(deletePhrase.trim());
                  ensureSuperTokensFrontendInitialized();
                  await signOut();
                  window.location.href = "/";
                } catch (error) {
                  setDeleteError(error);
                } finally {
                  setDeleteBusy(false);
                }
              })();
            }}
          >
            {deleteBusy ? <CircularProgress size={22} color="inherit" /> : "Usuń konto na zawsze"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default function ProfilePage() {
  return (
    <ThemeRegistry>
      <AppShell currentPath="/profile">
        <ProfileContent />
      </AppShell>
    </ThemeRegistry>
  );
}
