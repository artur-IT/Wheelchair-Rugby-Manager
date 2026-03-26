import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from "@mui/material";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import AppShell from "@/components/AppShell/AppShell";
import QueryProvider from "@/components/QueryProvider/QueryProvider";
import { useEffect, useState } from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { plPL } from "@mui/x-date-pickers/locales";
import { pl } from "date-fns/locale";
import { useForm, Controller, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import DataLoadAlert from "@/components/ui/DataLoadAlert";
import { createTournament, fetchTournamentById, updateTournament } from "@/lib/api/tournaments";
import { focusFirstFieldError } from "@/lib/forms/focusFirstFieldError";
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
    setFocus,
    setValue,
    watch,
    formState: { errors, touchedFields, submitCount },
    reset,
  } = useForm<TournamentFormData>({
    resolver: zodResolver(tournamentFormSchema as never),
    mode: "onBlur",
    reValidateMode: "onBlur",
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
      breakfastServingTime: "",
      breakfastLocation: "hotel",
      lunchServingTime: "",
      lunchLocation: "hotel",
      dinnerServingTime: "",
      dinnerLocation: "hotel",
      cateringNotes: "",
    },
  });

  const breakfastServingTimeValue = watch("breakfastServingTime");
  const breakfastLocationValue = watch("breakfastLocation");
  const lunchServingTimeValue = watch("lunchServingTime");
  const lunchLocationValue = watch("lunchLocation");
  const dinnerServingTimeValue = watch("dinnerServingTime");
  const dinnerLocationValue = watch("dinnerLocation");
  const cateringNotesValue = watch("cateringNotes");

  useEffect(() => {
    const mealDescription = [
      `Śniadanie: ${breakfastServingTimeValue} | Miejsce: ${breakfastLocationValue}`,
      `Obiad: ${lunchServingTimeValue} | Miejsce: ${lunchLocationValue}`,
      `Kolacja: ${dinnerServingTimeValue} | Miejsce: ${dinnerLocationValue}`,
      `Uwagi: ${cateringNotesValue}`,
    ].join("\n");
    setValue("catering", mealDescription, { shouldValidate: true });
  }, [
    breakfastServingTimeValue,
    breakfastLocationValue,
    lunchServingTimeValue,
    lunchLocationValue,
    dinnerServingTimeValue,
    dinnerLocationValue,
    cateringNotesValue,
    setValue,
  ]);

  const {
    data: tournamentForEdit,
    isPending,
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

  // TanStack Query v5: when `enabled: false`, `isPending` can still be true.
  // For "new tournament" page we don't want to block the form with an infinite loader.
  const prefillLoading = Boolean(tournamentId) && isPending;

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
  const onInvalid = (invalidErrors: FieldErrors<TournamentFormData>) => {
    focusFirstFieldError(invalidErrors, setFocus);
  };

  const isSubmitting = submitMutation.isPending;
  const showAllErrors = submitCount > 0;

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
        <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
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
                    error={Boolean((touchedFields.name || showAllErrors) && errors.name)}
                    helperText={touchedFields.name || showAllErrors ? errors.name?.message : undefined}
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
                          error: Boolean((touchedFields.startDate || showAllErrors) && errors.startDate),
                          helperText: touchedFields.startDate || showAllErrors ? errors.startDate?.message : undefined,
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
                          error: Boolean((touchedFields.endDate || showAllErrors) && errors.endDate),
                          helperText: touchedFields.endDate || showAllErrors ? errors.endDate?.message : undefined,
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
                    error={Boolean((touchedFields.hotel || showAllErrors) && errors.hotel)}
                    helperText={touchedFields.hotel || showAllErrors ? errors.hotel?.message : undefined}
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
                    error={Boolean((touchedFields.hotelCity || showAllErrors) && errors.hotelCity)}
                    helperText={touchedFields.hotelCity || showAllErrors ? errors.hotelCity?.message : undefined}
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
                    error={Boolean((touchedFields.hotelZipCode || showAllErrors) && errors.hotelZipCode)}
                    helperText={touchedFields.hotelZipCode || showAllErrors ? errors.hotelZipCode?.message : undefined}
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
                    error={Boolean((touchedFields.hotelStreet || showAllErrors) && errors.hotelStreet)}
                    helperText={touchedFields.hotelStreet || showAllErrors ? errors.hotelStreet?.message : undefined}
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
                    error={Boolean((touchedFields.parking || showAllErrors) && errors.parking)}
                    helperText={touchedFields.parking || showAllErrors ? errors.parking?.message : undefined}
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
                    error={Boolean((touchedFields.mapLink || showAllErrors) && errors.mapLink)}
                    helperText={touchedFields.mapLink || showAllErrors ? errors.mapLink?.message : undefined}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                Wyżywienie
              </Typography>
              <Grid container columnSpacing={2} rowSpacing={1}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>
                    Śniadania
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="breakfastServingTime"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Godziny wydawania"
                        placeholder="np. 07:00 - 09:00"
                        error={Boolean(
                          (touchedFields.breakfastServingTime || showAllErrors) && errors.breakfastServingTime
                        )}
                        helperText={
                          touchedFields.breakfastServingTime || showAllErrors
                            ? errors.breakfastServingTime?.message
                            : undefined
                        }
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="breakfastLocation"
                    control={control}
                    render={({ field }) => (
                      <FormControl
                        fullWidth
                        error={Boolean((touchedFields.breakfastLocation || showAllErrors) && errors.breakfastLocation)}
                      >
                        <InputLabel id="breakfast-location-label">Miejsce posiłku</InputLabel>
                        <Select {...field} labelId="breakfast-location-label" label="Miejsce posiłku">
                          <MenuItem value="hotel">Hotel</MenuItem>
                          <MenuItem value="hala">Hala</MenuItem>
                        </Select>
                        {(touchedFields.breakfastLocation || showAllErrors) && errors.breakfastLocation ? (
                          <FormHelperText>{errors.breakfastLocation.message}</FormHelperText>
                        ) : null}
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>
                    Obiady
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="lunchServingTime"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Godziny wydawania"
                        placeholder="np. 12:00 - 14:00"
                        error={Boolean((touchedFields.lunchServingTime || showAllErrors) && errors.lunchServingTime)}
                        helperText={
                          touchedFields.lunchServingTime || showAllErrors ? errors.lunchServingTime?.message : undefined
                        }
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="lunchLocation"
                    control={control}
                    render={({ field }) => (
                      <FormControl
                        fullWidth
                        error={Boolean((touchedFields.lunchLocation || showAllErrors) && errors.lunchLocation)}
                      >
                        <InputLabel id="lunch-location-label">Miejsce posiłku</InputLabel>
                        <Select {...field} labelId="lunch-location-label" label="Miejsce posiłku">
                          <MenuItem value="hotel">Hotel</MenuItem>
                          <MenuItem value="hala">Hala</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>
                    Kolacje
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="dinnerServingTime"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Godziny wydawania"
                        placeholder="np. 18:00 - 20:00"
                        error={Boolean((touchedFields.dinnerServingTime || showAllErrors) && errors.dinnerServingTime)}
                        helperText={
                          touchedFields.dinnerServingTime || showAllErrors
                            ? errors.dinnerServingTime?.message
                            : undefined
                        }
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="dinnerLocation"
                    control={control}
                    render={({ field }) => (
                      <FormControl
                        fullWidth
                        error={Boolean((touchedFields.dinnerLocation || showAllErrors) && errors.dinnerLocation)}
                      >
                        <InputLabel id="dinner-location-label">Miejsce posiłku</InputLabel>
                        <Select {...field} labelId="dinner-location-label" label="Miejsce posiłku">
                          <MenuItem value="hotel">Hotel</MenuItem>
                          <MenuItem value="hala">Hala</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Controller
                    name="cateringNotes"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        multiline
                        minRows={3}
                        label="Uwagi"
                        placeholder="Dodatkowe informacje o wyżywieniu"
                        error={Boolean((touchedFields.cateringNotes || showAllErrors) && errors.cateringNotes)}
                        helperText={
                          touchedFields.cateringNotes || showAllErrors ? errors.cateringNotes?.message : undefined
                        }
                      />
                    )}
                  />
                </Grid>
              </Grid>
              {(touchedFields.catering || showAllErrors) && errors.catering ? (
                <Typography sx={{ mt: 1, color: "error.main", fontSize: "0.75rem" }}>
                  {errors.catering.message}
                </Typography>
              ) : null}
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
                    error={Boolean((touchedFields.hallName || showAllErrors) && errors.hallName)}
                    helperText={touchedFields.hallName || showAllErrors ? errors.hallName?.message : undefined}
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
                    error={Boolean((touchedFields.city || showAllErrors) && errors.city)}
                    helperText={touchedFields.city || showAllErrors ? errors.city?.message : undefined}
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
                    error={Boolean((touchedFields.zipCode || showAllErrors) && errors.zipCode)}
                    helperText={touchedFields.zipCode || showAllErrors ? errors.zipCode?.message : undefined}
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
                    error={Boolean((touchedFields.street || showAllErrors) && errors.street)}
                    helperText={touchedFields.street || showAllErrors ? errors.street?.message : undefined}
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
                    error={Boolean((touchedFields.hallMapLink || showAllErrors) && errors.hallMapLink)}
                    helperText={
                      touchedFields.hallMapLink || showAllErrors
                        ? errors.hallMapLink?.message
                        : "Zostanie wygenerowany automatycznie jeśli nie podasz"
                    }
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
