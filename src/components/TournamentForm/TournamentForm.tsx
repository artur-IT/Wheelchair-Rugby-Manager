import { Box, Button, Grid, TextField, Typography, Paper, Divider } from "@mui/material";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import AppShell from "@/components/AppShell/AppShell";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tournamentFormSchema, type TournamentFormData } from "@/lib/validateInputs";
import { useState } from "react";

export default function TournamentForm() {
  return (
    <ThemeRegistry>
      <AppShell currentPath="/tournaments">
        <TournamentFormContent />
      </AppShell>
    </ThemeRegistry>
  );
}

function TournamentFormContent() {
  const [isLoading, setIsLoading] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TournamentFormData>({
    resolver: zodResolver(tournamentFormSchema as never),
    defaultValues: {
      name: "",
      startDate: undefined,
      endDate: undefined,
      hotel: "",
      city: "",
      zipCode: "",
      street: "",
      mapLink: "",
      catering: "",
      hallName: "",
      hallMapLink: "",
    },
  });

  const onSubmit = async (data: TournamentFormData) => {
    try {
      setIsLoading(true);
      // TODO: Send data to API endpoint (POST /api/tournaments or PUT /api/tournaments/:id)
      void data;
      window.location.href = "/tournaments";
    } catch {
      // Handle error silently for now
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 600, mx: "auto", borderRadius: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: "bold", mb: 3 }}>
        Nowy / Edytuj Turniej
      </Typography>
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
          <Grid size={{ xs: 12 }}>
            <Controller
              name="mapLink"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Link do Mapy"
                  placeholder="https://..."
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
        </Grid>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2 }}>
          Lokalizacja
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
          <Grid size={12}>
            <Controller
              name="hallMapLink"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Link do Mapy (Hala)"
                  placeholder="https://..."
                  error={!!errors.hallMapLink}
                  helperText={errors.hallMapLink?.message}
                />
              )}
            />
          </Grid>
        </Grid>

        <Box sx={{ display: "flex", gap: 2, pt: 2 }}>
          <Button variant="outlined" fullWidth component="a" href="/tournaments">
            Anuluj
          </Button>
          <Button variant="contained" type="submit" fullWidth disabled={isLoading}>
            {isLoading ? "Zapisywanie..." : "Zapisz Turniej"}
          </Button>
        </Box>
      </form>
    </Paper>
  );
}
