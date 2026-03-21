import { Box, Button, Grid, TextField, Typography, Paper, Divider, CircularProgress, Alert } from "@mui/material";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import AppShell from "@/components/AppShell/AppShell";
import { useEffect, useState } from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tournamentFormSchema, type TournamentFormData } from "@/lib/validateInputs";
import type { Tournament } from "@/types";
import { tournamentToTournamentFormDefaults } from "@/lib/tournamentFormMapping";

interface Props {
  tournamentId?: string;
}

export default function TournamentForm({ tournamentId }: Props) {
  return (
    <ThemeRegistry>
      <AppShell currentPath="/tournaments">
        <TournamentFormContent tournamentId={tournamentId} />
      </AppShell>
    </ThemeRegistry>
  );
}

function TournamentFormContent({ tournamentId }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(!!tournamentId);
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

  useEffect(() => {
    if (!tournamentId) return;

    const controller = new AbortController();

    async function loadTournament() {
      setPrefillLoading(true);
      setFormError(null);
      try {
        const res = await fetch(`/api/tournaments/${tournamentId}`, { signal: controller.signal });
        if (!res.ok) {
          throw new Error("Nie udało się pobrać turnieju do edycji");
        }

        const data: Tournament = await res.json();
        reset(tournamentToTournamentFormDefaults(data));
      } catch (err) {
        if (controller.signal.aborted) return;
        setFormError(err instanceof Error ? err.message : "Wystąpił błąd podczas pobierania turnieju");
      } finally {
        if (!controller.signal.aborted) setPrefillLoading(false);
      }
    }

    loadTournament();
    return () => controller.abort();
  }, [tournamentId, reset]);

  const onSubmit = async (data: TournamentFormData) => {
    setFormError(null);
    try {
      setIsSubmitting(true);
      const response = await fetch(tournamentId ? `/api/tournaments/${tournamentId}` : "/api/tournaments", {
        method: tournamentId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        setFormError("Nie udało się zapisać turnieju");
        return;
      }

      window.location.href = "/tournaments";
    } catch {
      setFormError("Nie udało się zapisać turnieju");
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = tournamentId ? "Edytuj Turniej" : "Nowy Turniej";

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
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      {...field}
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
