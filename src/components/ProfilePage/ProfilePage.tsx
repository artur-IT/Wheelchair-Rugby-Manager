import { UserCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Box, Button, CircularProgress, Grid, TextField, Typography, Paper, Avatar } from "@mui/material";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import AppShell from "@/components/AppShell/AppShell";
import { z } from "@/lib/zodPl";
import { fetchCurrentUserProfile, updateCurrentUserProfile } from "@/lib/api/users";
import DataLoadAlert from "@/components/ui/DataLoadAlert";
import MutationErrorAlert from "@/components/ui/MutationErrorAlert";
import { focusFirstFieldError } from "@/lib/forms/focusFirstFieldError";
import { requiredFirstNameSchema, requiredLastNameSchema } from "@/lib/validateInputs";

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
