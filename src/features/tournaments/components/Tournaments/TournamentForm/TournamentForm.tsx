import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Button, Grid, TextField, Typography, Paper, Divider, CircularProgress, Alert } from "@mui/material";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import AppShell from "@/components/AppShell/AppShell";
import QueryProvider from "@/components/QueryProvider/QueryProvider";
import { useEffect, useState } from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { plPL } from "@mui/x-date-pickers/locales";
import { pl } from "date-fns/locale";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import DataLoadAlert from "@/components/ui/DataLoadAlert";
import { createTournament, fetchTournamentById, updateTournament } from "@/lib/api/tournaments";
import { queryKeys } from "@/lib/queryKeys";
import { tournamentFormSchema, type TournamentFormData } from "@/lib/validateInputs";
import { tournamentDatesChangedForEdit, tournamentToTournamentFormDefaults } from "@/lib/tournamentFormMapping";

interface Props {
  tournamentId?: string;
}

function redirectToTournamentsList() {
  window.location.assign("/tournaments");
}

export default function TournamentForm({ tournamentId }: Props) {
  return (
    <QueryProvider>
      <ThemeRegistry>
        <AppShell currentPath="/tournaments">
          <TournamentFormContent tournamentId={tournamentId} />
        </AppShell>
      </ThemeRegistry>
    </QueryProvider>
  );
}

function TournamentFormContent({ tournamentId }: Props) {
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TournamentFormData>({
    resolver: zodResolver(tournamentFormSchema as never),
    defaultValues: {
      name: "",
      startDate: undefined,
      endDate: undefined,
      hotel: "",
      hotelCity: "",
      hotelZipCode: "",
      hotelStreet: "",
      mapLink: "",
      catering: "",
      parking: "",
      hallName: "",
      city: "",
      zipCode: "",
      street: "",
      hallMapLink: "",
    },
  });

  const {
    data: tournamentForEdit,
    isPending: prefillLoading,
    isError: loadIsError,
    error: loadErrorObj,
    refetch,
  } = useQuery({
    queryKey: queryKeys.tournaments.detail(tournamentId ?? "__none__"),
    queryFn: ({ signal }) => {
      if (!tournamentId) return Promise.reject(new Error("Brak id turnieju"));
      return fetchTournamentById(tournamentId, signal);
    },
    enabled: Boolean(tournamentId),
  });

  const loadError = loadIsError && loadErrorObj instanceof Error ? loadErrorObj.message : null;

  useEffect(() => {
    if (tournamentForEdit) {
      reset(tournamentToTournamentFormDefaults(tournamentForEdit));
      setFormError(null);
    }
  }, [tournamentForEdit, reset]);

  const submitMutation = useMutation({
    mutationFn: (data: TournamentFormData) =>
      tournamentId ? updateTournament(tournamentId, data) : createTournament(data),
    onSuccess: async (saved, variables) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.list() });
      if (tournamentId && tournamentForEdit) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.detail(tournamentId) });
        await queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.matches(tournamentId) });
        if (tournamentDatesChangedForEdit(tournamentForEdit, variables)) {
          sessionStorage.setItem(`wr-tournament-dates-edited:${tournamentId}`, "1");
        }
      }
      if (saved.seasonId) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.season(saved.seasonId) });
      } else {
        await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      }
      redirectToTournamentsList();
    },
    onError: (e: unknown) => {
      setFormError(e instanceof Error ? e.message : "Nie udało się zapisać turnieju");
    },
  });

  const onSubmit = (data: TournamentFormData) => {
    setFormError(null);
    submitMutation.mutate(data);
  };

  const isSubmitting = submitMutation.isPending;

  const title = tournamentId ? "Edytuj Turniej" : "Nowy Turniej";

  if (tournamentId && loadError && !prefillLoading) {
    return (
      <Paper sx={{ p: 4, maxWidth: 600, mx: "auto", borderRadius: 3 }}>
        <DataLoadAlert message={loadError} onRetry={() => void refetch()} />
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 4, maxWidth: 600, mx: "auto", borderRadius: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: "bold", mb: 3 }}>
        {title}
      </Typography>
      {formError ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {formError}
        </Alert>
      ) : null}

      {prefillLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12 }}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Nazwa Turnieju"
                    placeholder="np. Turniej Jesienny"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />
            </Grid>
            <LocalizationProvider
              dateAdapter={AdapterDateFns}
              adapterLocale={pl}
              localeText={plPL.components.MuiLocalizationProvider.defaultProps.localeText}
            >
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      {...field}
                      value={field.value ?? null}
                      label="Data Rozpoczęcia"
                      slotProps={{
                        textField: {
                          error: !!errors.startDate,
                          helperText: errors.startDate?.message,
                          fullWidth: true,
                        },
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="endDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      {...field}
                      value={field.value ?? null}
                      label="Data Zakończenia"
                      slotProps={{
                        textField: {
                          error: !!errors.endDate,
                          helperText: errors.endDate?.message,
                          fullWidth: true,
                        },
                      }}
                    />
                  )}
                />
              </Grid>
            </LocalizationProvider>
          </Grid>

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2 }}>
            Zakwaterowanie
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12 }}>
              <Controller
                name="hotel"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Hotel"
                    placeholder="Hotel"
                    error={!!errors.hotel}
                    helperText={errors.hotel?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="hotelCity"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Miasto"
                    placeholder="Miasto"
                    error={!!errors.hotelCity}
                    helperText={errors.hotelCity?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="hotelZipCode"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Kod pocztowy"
                    placeholder="XX-XXX"
                    error={!!errors.hotelZipCode}
                    helperText={errors.hotelZipCode?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="hotelStreet"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Ulica"
                    placeholder="Ulica"
                    error={!!errors.hotelStreet}
                    helperText={errors.hotelStreet?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Controller
                name="mapLink"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Link do Mapy"
                    placeholder="Jeśli nie podasz to zostanie wygenerowany automatycznie"
                    error={!!errors.mapLink}
                    helperText={errors.mapLink?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Controller
                name="catering"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Wyżywienie"
                    placeholder="np. Hotel + Catering na hali"
                    error={!!errors.catering}
                    helperText={errors.catering?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Controller
                name="parking"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Parking"
                    placeholder="Parking"
                    error={!!errors.parking}
                    helperText={errors.parking?.message}
                  />
                )}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2 }}>
            Hala Sportowa
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="hallName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Nazwa Hali"
                    error={!!errors.hallName}
                    helperText={errors.hallName?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="city"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Miasto"
                    placeholder="Miasto"
                    error={!!errors.city}
                    helperText={errors.city?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="zipCode"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Kod pocztowy"
                    placeholder="XX-XXX"
                    error={!!errors.zipCode}
                    helperText={errors.zipCode?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="street"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Ulica"
                    placeholder="Ulica"
                    error={!!errors.street}
                    helperText={errors.street?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={12}>
              <Controller
                name="hallMapLink"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Link do Mapy (Hala)"
                    placeholder="Jeśli nie podasz to zostanie wygenerowany automatycznie"
                    error={!!errors.hallMapLink}
                    helperText={errors.hallMapLink?.message || "Zostanie wygenerowany automatycznie jeśli nie podasz"}
                  />
                )}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: "flex", gap: 2, pt: 2 }}>
            <Button variant="outlined" fullWidth component="a" href="/tournaments">
              Anuluj
            </Button>
            <Button variant="contained" type="submit" fullWidth disabled={isSubmitting}>
              {isSubmitting ? "Zapisywanie..." : "Zapisz Turniej"}
            </Button>
          </Box>
        </form>
      )}
    </Paper>
  );
}
