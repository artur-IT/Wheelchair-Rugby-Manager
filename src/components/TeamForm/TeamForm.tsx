import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import AppShell from "@/components/AppShell/AppShell";
import type { Season } from "@/types";

// Validation schema matching the API contract
const teamSchema = z.object({
  name: z.string().min(1, "Nazwa drużyny jest wymagana"),
  address: z.string().min(1, "Adres jest wymagany"),
  logoUrl: z.union([z.string().url("Nieprawidłowy adres URL"), z.literal("")]).optional(),
  contactFirstName: z.string().min(1, "Imię jest wymagane"),
  contactLastName: z.string().min(1, "Nazwisko jest wymagane"),
  contactEmail: z.string().email("Nieprawidłowy adres email"),
  contactPhone: z.string().min(1, "Telefon jest wymagany"),
  coachId: z.string().optional(),
  refereeId: z.string().optional(),
  coachFirstName: z.string().optional(),
  coachLastName: z.string().optional(),
  coachEmail: z.union([z.string().email("Nieprawidłowy email"), z.literal("")]).optional(),
  coachPhone: z.string().optional(),
  refereeFirstName: z.string().optional(),
  refereeLastName: z.string().optional(),
  refereeEmail: z.union([z.string().email("Nieprawidłowy email"), z.literal("")]).optional(),
  refereePhone: z.string().optional(),
});

type TeamFormValues = z.infer<typeof teamSchema>;

export default function TeamForm() {
  return (
    <ThemeRegistry>
      <AppShell currentPath="/settings">
        <TeamFormContent />
      </AppShell>
    </ThemeRegistry>
  );
}

function TeamFormContent() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonId, setSeasonId] = useState<string>("");
  const [loadingSeasons, setLoadingSeasons] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TeamFormValues>({ resolver: zodResolver(teamSchema as never) });

  // Fetch all seasons so user can pick one
  useEffect(() => {
    async function fetchSeasons() {
      try {
        const res = await fetch("/api/seasons");
        if (!res.ok) throw new Error("Nie udało się pobrać sezonów");
        const data: Season[] = await res.json();
        setSeasons(data);
        if (data.length > 0) setSeasonId(data[0].id);
      } catch {
        setSubmitError("Nie udało się pobrać sezonów. Upewnij się, że istnieje co najmniej jeden sezon.");
      } finally {
        setLoadingSeasons(false);
      }
    }
    fetchSeasons();
  }, []);

  const onSubmit = async (data: TeamFormValues) => {
    setSubmitError(null);

    if (!seasonId) {
      setSubmitError("Wybierz sezon przed zapisaniem drużyny.");
      return;
    }

    let coachId: string | undefined = data.coachId?.trim() || undefined;
    let refereeId: string | undefined = data.refereeId?.trim() || undefined;

    try {
      // Create coach if "new" mode and required fields present
      if (data.coachFirstName && data.coachLastName) {
        const fn = (data.coachFirstName ?? "").trim();
        const ln = (data.coachLastName ?? "").trim();
        if (!fn || !ln) {
          setSubmitError("Imię i nazwisko trenera są wymagane przy dodawaniu nowego trenera.");
          return;
        }
        const coachRes = await fetch("/api/coaches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: fn,
            lastName: ln,
            email: (data.coachEmail ?? "").trim() || undefined,
            phone: (data.coachPhone ?? "").trim() || undefined,
            seasonId,
          }),
        });
        if (!coachRes.ok) {
          const err = await coachRes.json().catch(() => null);
          throw new Error(err?.error?.formErrors?.[0] ?? "Nie udało się dodać trenera");
        }
        const createdCoach = await coachRes.json();
        coachId = createdCoach.id;
      }

      // Create referee if "new" mode and required fields present
      if (data.refereeFirstName && data.refereeLastName) {
        const fn = (data.refereeFirstName ?? "").trim();
        const ln = (data.refereeLastName ?? "").trim();
        if (!fn || !ln) {
          setSubmitError("Imię i nazwisko sędziego są wymagane przy dodawaniu nowego sędziego.");
          return;
        }
        const refereeRes = await fetch("/api/referees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: fn,
            lastName: ln,
            email: (data.refereeEmail ?? "").trim() || undefined,
            phone: (data.refereePhone ?? "").trim() || undefined,
            seasonId,
          }),
        });
        if (!refereeRes.ok) {
          const err = await refereeRes.json().catch(() => null);
          throw new Error(err?.error?.formErrors?.[0] ?? "Nie udało się dodać sędziego");
        }
        const createdReferee = await refereeRes.json();
        refereeId = createdReferee.id;
      }

      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          address: data.address,
          logoUrl: data.logoUrl?.trim() || undefined,
          contactFirstName: data.contactFirstName,
          contactLastName: data.contactLastName,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          seasonId,
          coachId,
          refereeId,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error?.formErrors?.[0] ?? "Nie udało się zapisać drużyny");
      }

      window.location.href = "/settings";
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
    }
  };

  if (loadingSeasons) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 4, maxWidth: 600, mx: "auto", borderRadius: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: "bold", mb: 3 }}>
        Nowa Drużyna
      </Typography>

      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {submitError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Season selector */}
        <FormControl fullWidth sx={{ mb: 3 }} error={seasons.length === 0}>
          <InputLabel>Sezon</InputLabel>
          <Select label="Sezon" value={seasonId} onChange={(e: SelectChangeEvent) => setSeasonId(e.target.value)}>
            {seasons.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name}
                {s.year ? ` (${s.year})` : ""}
              </MenuItem>
            ))}
          </Select>
          {seasons.length === 0 && (
            <FormHelperText>
              Brak sezonów — <a href="/settings/seasons/new">utwórz sezon</a>
            </FormHelperText>
          )}
        </FormControl>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Nazwa Drużyny"
              {...register("name")}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Adres"
              {...register("address")}
              error={!!errors.address}
              helperText={errors.address?.message}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="URL logo (opcjonalnie)"
              placeholder="https://..."
              {...register("logoUrl")}
              error={!!errors.logoUrl}
              helperText={errors.logoUrl?.message}
            />
          </Grid>
        </Grid>

        <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2 }}>
          Osoba do kontaktu
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Imię"
              {...register("contactFirstName")}
              error={!!errors.contactFirstName}
              helperText={errors.contactFirstName?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Nazwisko"
              {...register("contactLastName")}
              error={!!errors.contactLastName}
              helperText={errors.contactLastName?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              type="email"
              label="Email"
              {...register("contactEmail")}
              error={!!errors.contactEmail}
              helperText={errors.contactEmail?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              type="tel"
              label="Telefon"
              {...register("contactPhone")}
              error={!!errors.contactPhone}
              helperText={errors.contactPhone?.message}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Coach: select existing or add new */}
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2 }}>
          Trener
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label="Imię"
              {...register("coachFirstName")}
              error={!!errors.coachFirstName}
              helperText={errors.coachFirstName?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Nazwisko"
              {...register("coachLastName")}
              error={!!errors.coachLastName}
              helperText={errors.coachLastName?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              type="email"
              label="Email (opcjonalnie)"
              {...register("coachEmail")}
              error={!!errors.coachEmail}
              helperText={errors.coachEmail?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth type="tel" label="Telefon (opcjonalnie)" {...register("coachPhone")} />
          </Grid>
        </Grid>

        {/* Referee: select existing or add new */}
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2 }}>
          Sędzia
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Imię"
              {...register("refereeFirstName")}
              error={!!errors.refereeFirstName}
              helperText={errors.refereeFirstName?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Nazwisko"
              {...register("refereeLastName")}
              error={!!errors.refereeLastName}
              helperText={errors.refereeLastName?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              type="email"
              label="Email (opcjonalnie)"
              {...register("refereeEmail")}
              error={!!errors.refereeEmail}
              helperText={errors.refereeEmail?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth type="tel" label="Telefon (opcjonalnie)" {...register("refereePhone")} />
          </Grid>
        </Grid>

        <Box sx={{ display: "flex", gap: 2, pt: 2 }}>
          <Button variant="outlined" fullWidth component="a" href="/settings">
            Anuluj
          </Button>
          <Button
            variant="contained"
            color="success"
            type="submit"
            fullWidth
            disabled={isSubmitting || !seasonId || seasons.length === 0}
          >
            {isSubmitting ? <CircularProgress size={24} /> : "Zapisz Drużynę"}
          </Button>
        </Box>
      </form>
    </Paper>
  );
}
