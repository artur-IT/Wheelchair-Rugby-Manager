import React, { useState, useEffect } from "react";
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
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import type { SelectChangeEvent } from "@mui/material";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import AppShell from "@/components/AppShell/AppShell";
import type { Season, Team } from "@/types";
import {
  sanitizePhone,
  optionalPhoneSchema,
  requiredPhoneSchema,
  requiredFirstNameSchema,
  requiredLastNameSchema,
  requiredEmailSchema,
  optionalFirstNameSchema,
  optionalLastNameSchema,
  optionalEmailSchema,
  requiredTeamNameSchema,
  requiredAddressSchema,
  requiredCitySchema,
  requiredPostalCodeSchema,
  optionalWebsiteUrlSchema,
  MAX_SHORT_TEXT,
} from "@/lib/validateInputs";

// Validation schema matching the API contract
const teamSchema = z.object({
  name: requiredTeamNameSchema,
  address: requiredAddressSchema,
  city: requiredCitySchema,
  postalCode: requiredPostalCodeSchema,
  contactFirstName: requiredFirstNameSchema,
  contactLastName: requiredLastNameSchema,
  contactEmail: requiredEmailSchema,
  contactPhone: requiredPhoneSchema,
  websiteUrl: optionalWebsiteUrlSchema,
  coachId: z.string().optional(),
  refereeId: z.string().optional(),
  // Coach first/last name have custom required messages so max is chained inline
  coachFirstName: z
    .string()
    .min(1, "Imię trenera jest wymagane")
    .max(MAX_SHORT_TEXT, `Imię nie może przekraczać ${MAX_SHORT_TEXT} znaków`),
  coachLastName: z
    .string()
    .min(1, "Nazwisko trenera jest wymagane")
    .max(MAX_SHORT_TEXT, `Nazwisko nie może przekraczać ${MAX_SHORT_TEXT} znaków`),
  coachEmail: optionalEmailSchema,
  coachPhone: optionalPhoneSchema,
  refereeFirstName: optionalFirstNameSchema,
  refereeLastName: optionalLastNameSchema,
  refereeEmail: optionalEmailSchema,
  refereePhone: optionalPhoneSchema,
  staffFirstName: optionalFirstNameSchema,
  staffLastName: optionalLastNameSchema,
});

type TeamFormValues = z.infer<typeof teamSchema>;

// Subtle orange outline for required fields so user sees what is needed to save
const requiredFieldSx = {
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(237, 108, 2, 0.45)",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(237, 108, 2, 0.65)",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "primary.main",
    borderWidth: "1px",
  },
};

// One row in the players list (inputs as strings)
interface PlayerRow {
  id: string;
  firstName: string;
  lastName: string;
  classification: string;
  number: string;
}

interface StaffRow {
  id: string;
  firstName: string;
  lastName: string;
}

export interface TeamFormContentProps {
  /** When "edit", form is pre-filled from initialTeam and submit does PUT. */
  mode?: "create" | "edit";
  initialTeam?: Team | null;
  onSuccess?: (updated?: Team) => void;
  onCancel?: () => void;
}

export default function TeamForm() {
  return (
    <ThemeRegistry>
      <AppShell currentPath="/settings">
        <TeamFormContent />
      </AppShell>
    </ThemeRegistry>
  );
}

export function TeamFormContent({ mode = "create", initialTeam = null, onSuccess, onCancel }: TeamFormContentProps) {
  const isEdit = mode === "edit" && initialTeam;

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonId, setSeasonId] = useState<string>("");
  const [loadingSeasons, setLoadingSeasons] = useState(true);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [staff, setStaff] = useState<StaffRow[]>([]);

  const effectiveSeasonId = seasonId || (isEdit && initialTeam ? initialTeam.seasonId : "");

  const addPlayer = () =>
    setPlayers((prev) => [
      ...prev,
      { id: crypto.randomUUID(), firstName: "", lastName: "", classification: "", number: "" },
    ]);
  const removePlayer = (id: string) => setPlayers((prev) => prev.filter((p) => p.id !== id));
  const updatePlayer = (id: string, field: keyof PlayerRow, value: string) =>
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));

  const addStaff = () => setStaff((prev) => [...prev, { id: crypto.randomUUID(), firstName: "", lastName: "" }]);
  const removeStaff = (id: string) => setStaff((prev) => prev.filter((s) => s.id !== id));
  const updateStaff = (id: string, field: keyof StaffRow, value: string) =>
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));

  const defaultFormValues: TeamFormValues = isEdit
    ? {
        name: initialTeam.name ?? "",
        address: initialTeam.address ?? "",
        city: initialTeam.city ?? "",
        postalCode: initialTeam.postalCode ?? "",
        websiteUrl: initialTeam.websiteUrl ?? "",
        contactFirstName: initialTeam.contactFirstName ?? "",
        contactLastName: initialTeam.contactLastName ?? "",
        contactEmail: initialTeam.contactEmail ?? "",
        contactPhone: initialTeam.contactPhone ?? "",
        coachFirstName: initialTeam.coach?.firstName ?? "",
        coachLastName: initialTeam.coach?.lastName ?? "",
        coachEmail: initialTeam.coach?.email ?? "",
        coachPhone: initialTeam.coach?.phone != null ? String(initialTeam.coach.phone) : "",
        refereeFirstName: initialTeam.referee?.firstName ?? "",
        refereeLastName: initialTeam.referee?.lastName ?? "",
        refereeEmail: initialTeam.referee?.email ?? "",
        refereePhone: initialTeam.referee?.phone != null ? String(initialTeam.referee.phone) : "",
        staffFirstName: "",
        staffLastName: "",
      }
    : {
        name: "",
        address: "",
        city: "",
        postalCode: "",
        contactFirstName: "",
        contactLastName: "",
        contactEmail: "",
        contactPhone: "",
        coachFirstName: "",
        coachLastName: "",
      };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema as never),
    defaultValues: defaultFormValues,
  });

  // Fetch seasons and when edit mode pre-fill from initialTeam
  useEffect(() => {
    async function fetchSeasons() {
      try {
        const res = await fetch("/api/seasons");
        if (!res.ok) throw new Error("Nie udało się pobrać sezonów");
        const data: Season[] = await res.json();
        setSeasons(data);
        if (isEdit && initialTeam) {
          setSeasonId(initialTeam.seasonId);
          setPlayers(
            (initialTeam.players ?? []).map((p) => ({
              id: p.id,
              firstName: p.firstName,
              lastName: p.lastName,
              classification: p.classification != null ? String(p.classification) : "",
              number: p.number != null ? String(p.number) : "",
            }))
          );
          setStaff(
            (initialTeam.staff ?? []).map((s) => ({
              id: s.id,
              firstName: s.firstName,
              lastName: s.lastName,
            }))
          );
          reset({
            name: initialTeam.name ?? "",
            address: initialTeam.address ?? "",
            city: initialTeam.city ?? "",
            postalCode: initialTeam.postalCode ?? "",
            websiteUrl: initialTeam.websiteUrl ?? "",
            contactFirstName: initialTeam.contactFirstName ?? "",
            contactLastName: initialTeam.contactLastName ?? "",
            contactEmail: initialTeam.contactEmail ?? "",
            contactPhone: initialTeam.contactPhone ?? "",
            coachFirstName: initialTeam.coach?.firstName ?? "",
            coachLastName: initialTeam.coach?.lastName ?? "",
            coachEmail: initialTeam.coach?.email ?? "",
            coachPhone: initialTeam.coach?.phone != null ? String(initialTeam.coach.phone) : "",
            refereeFirstName: initialTeam.referee?.firstName ?? "",
            refereeLastName: initialTeam.referee?.lastName ?? "",
            refereeEmail: initialTeam.referee?.email ?? "",
            refereePhone: initialTeam.referee?.phone != null ? String(initialTeam.referee.phone) : "",
            staffFirstName: "",
            staffLastName: "",
          });
        } else if (data.length > 0 && !isEdit) {
          setSeasonId(data[0].id);
        }
      } catch {
        setSubmitError("Nie udało się pobrać sezonów. Upewnij się, że istnieje co najmniej jeden sezon.");
      } finally {
        setLoadingSeasons(false);
      }
    }
    fetchSeasons();
  }, [isEdit, reset]); // eslint-disable-line react-hooks/exhaustive-deps -- initialTeam only for edit, run once

  const onSubmit = async (data: TeamFormValues) => {
    setSubmitError(null);

    if (!effectiveSeasonId) {
      setSubmitError("Wybierz sezon przed zapisaniem drużyny.");
      return;
    }

    let coachId: string | undefined =
      isEdit && initialTeam ? (initialTeam.coachId ?? undefined) : data.coachId?.trim() || undefined;
    let refereeId: string | undefined =
      isEdit && initialTeam ? (initialTeam.refereeId ?? undefined) : data.refereeId?.trim() || undefined;

    try {
      // Create coach if "new" mode and required fields present (or edit with new coach data)
      if (data.coachFirstName?.trim() && data.coachLastName?.trim()) {
        const fn = (data.coachFirstName ?? "").trim();
        const ln = (data.coachLastName ?? "").trim();
        const coachRes = await fetch("/api/coaches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: fn,
            lastName: ln,
            email: (data.coachEmail ?? "").trim() || undefined,
            phone: (data.coachPhone ?? "").trim() || undefined,
            seasonId: effectiveSeasonId,
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
      if (data.refereeFirstName?.trim() && data.refereeLastName?.trim()) {
        const fn = (data.refereeFirstName ?? "").trim();
        const ln = (data.refereeLastName ?? "").trim();
        const refereeRes = await fetch("/api/referees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: fn,
            lastName: ln,
            email: (data.refereeEmail ?? "").trim() || undefined,
            phone: (data.refereePhone ?? "").trim() || undefined,
            seasonId: effectiveSeasonId,
          }),
        });
        if (!refereeRes.ok) {
          const err = await refereeRes.json().catch(() => null);
          throw new Error(err?.error?.formErrors?.[0] ?? "Nie udało się dodać sędziego");
        }
        const createdReferee = await refereeRes.json();
        refereeId = createdReferee.id;
      }

      const staffPayload = staff
        .filter((s) => s.firstName.trim() && s.lastName.trim())
        .map((s) => ({ firstName: s.firstName.trim(), lastName: s.lastName.trim() }));
      const playersPayload = players
        .filter((p) => p.firstName.trim() && p.lastName.trim())
        .map((p) => ({
          firstName: p.firstName.trim(),
          lastName: p.lastName.trim(),
          classification:
            p.classification.trim() !== "" && !Number.isNaN(Number(p.classification))
              ? Number(p.classification)
              : undefined,
          number: p.number.trim() !== "" && !Number.isNaN(Number(p.number)) ? Number(p.number) : undefined,
        }));

      // Always send full players list when editing so backend replaces correctly
      const websiteUrl = data.websiteUrl?.trim() || undefined;
      const body = {
        name: data.name,
        address: data.address,
        city: data.city,
        postalCode: data.postalCode,
        websiteUrl,
        contactFirstName: data.contactFirstName,
        contactLastName: data.contactLastName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        seasonId: effectiveSeasonId,
        coachId,
        refereeId,
        staff: staffPayload.length > 0 ? staffPayload : undefined,
        players: playersPayload,
      };

      if (isEdit && initialTeam) {
        const res = await fetch(`/api/teams/${initialTeam.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error?.formErrors?.[0] ?? "Nie udało się zaktualizować drużyny");
        }
        const updated: Team = await res.json();
        onSuccess?.(updated);
      } else {
        const res = await fetch("/api/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error?.formErrors?.[0] ?? "Nie udało się zapisać drużyny");
        }
        if (onSuccess) onSuccess();
        else window.location.href = "/settings";
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
    }
  };

  // Register phone fields once and wrap onChange to sanitize input on type
  const makePhoneField = (name: "contactPhone" | "coachPhone" | "refereePhone") => {
    const field = register(name);
    return {
      ...field,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        e.target.value = sanitizePhone(e.target.value);
        field.onChange(e);
      },
    };
  };
  const contactPhoneField = makePhoneField("contactPhone");
  const coachPhoneField = makePhoneField("coachPhone");
  const refereePhoneField = makePhoneField("refereePhone");

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
        {isEdit ? "Edytuj drużynę" : "Nowa Drużyna"}
      </Typography>

      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {submitError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Season selector */}
        <FormControl fullWidth sx={{ mb: 3, ...requiredFieldSx }} error={seasons.length === 0}>
          <InputLabel>Sezon</InputLabel>
          <Select
            label="Sezon"
            value={seasonId}
            onChange={(e: SelectChangeEvent) => setSeasonId(e.target.value)}
            readOnly={isEdit && seasons.length <= 1}
          >
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
              sx={requiredFieldSx}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Adres"
              {...register("address")}
              error={!!errors.address}
              helperText={errors.address?.message}
              sx={requiredFieldSx}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 8 }}>
            <TextField
              fullWidth
              label="Miasto"
              {...register("city")}
              error={!!errors.city}
              helperText={errors.city?.message}
              sx={requiredFieldSx}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="Kod pocztowy"
              placeholder="00-000"
              {...register("postalCode")}
              error={!!errors.postalCode}
              helperText={errors.postalCode?.message}
              sx={requiredFieldSx}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Strona internetowa (opcjonalnie)"
              {...register("websiteUrl")}
              error={!!errors.websiteUrl}
              helperText={errors.websiteUrl?.message}
            />
          </Grid>
        </Grid>

        {/* Contact person */}
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
              sx={requiredFieldSx}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Nazwisko"
              {...register("contactLastName")}
              error={!!errors.contactLastName}
              helperText={errors.contactLastName?.message}
              sx={requiredFieldSx}
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
              sx={requiredFieldSx}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              type="tel"
              label="Telefon"
              {...contactPhoneField}
              placeholder="9 cyfr"
              inputProps={{ inputMode: "numeric" }}
              error={!!errors.contactPhone}
              helperText={errors.contactPhone?.message}
              sx={requiredFieldSx}
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
              sx={requiredFieldSx}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Nazwisko"
              required
              {...register("coachLastName")}
              error={!!errors.coachLastName}
              helperText={errors.coachLastName?.message}
              sx={requiredFieldSx}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              type="email"
              label="Email"
              {...register("coachEmail")}
              error={!!errors.coachEmail}
              helperText={errors.coachEmail?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              type="tel"
              label="Telefon"
              {...coachPhoneField}
              placeholder="9 cyfr"
              inputProps={{ inputMode: "numeric" }}
              error={!!errors.coachPhone}
              helperText={errors.coachPhone?.message}
            />
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
            <TextField
              fullWidth
              type="tel"
              label="Telefon (opcjonalnie)"
              {...refereePhoneField}
              placeholder="9 cyfr"
              inputProps={{ inputMode: "numeric" }}
              error={!!errors.refereePhone}
              helperText={errors.refereePhone?.message}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Staff */}
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2 }}>
          Staff
        </Typography>
        {staff.map((s) => (
          <Grid container spacing={2} key={s.id} alignItems="center" sx={{ mb: 1 }}>
            <Grid size={{ xs: 12, sm: 5 }}>
              <TextField
                fullWidth
                size="small"
                label="Imię"
                value={s.firstName}
                onChange={(e) => updateStaff(s.id, "firstName", e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 5 }}>
              <TextField
                fullWidth
                size="small"
                label="Nazwisko"
                value={s.lastName}
                onChange={(e) => updateStaff(s.id, "lastName", e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <IconButton aria-label="Usuń" onClick={() => removeStaff(s.id)} color="error" size="small">
                <DeleteOutlineIcon />
              </IconButton>
            </Grid>
          </Grid>
        ))}
        <Button type="button" variant="outlined" startIcon={<AddIcon />} onClick={addStaff} sx={{ mb: 3 }}>
          Dodaj osobę ze staffu
        </Button>

        <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2 }}>
          Zawodnicy
        </Typography>
        {players.map((p) => (
          <Grid container spacing={2} key={p.id} alignItems="center" sx={{ mb: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Imię"
                value={p.firstName}
                onChange={(e) => updatePlayer(p.id, "firstName", e.target.value)}
                sx={requiredFieldSx}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Nazwisko"
                value={p.lastName}
                onChange={(e) => updatePlayer(p.id, "lastName", e.target.value)}
                sx={requiredFieldSx}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                inputProps={{ min: 0.5, max: 4.0, step: 0.5, inputMode: "decimal" }}
                label="Klasyfikacja"
                value={p.classification}
                onChange={(e) => updatePlayer(p.id, "classification", e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                inputProps={{ min: 1, max: 99, inputMode: "numeric" }}
                label="Numer"
                value={p.number}
                onChange={(e) => updatePlayer(p.id, "number", e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <IconButton aria-label="Usuń zawodnika" onClick={() => removePlayer(p.id)} color="error" size="small">
                <DeleteOutlineIcon />
              </IconButton>
            </Grid>
          </Grid>
        ))}
        <Button type="button" variant="outlined" startIcon={<AddIcon />} onClick={addPlayer} sx={{ mb: 3 }}>
          Dodaj zawodnika
        </Button>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: "flex", gap: 2, pt: 2 }}>
          {onCancel ? (
            <Button variant="outlined" fullWidth onClick={onCancel}>
              Anuluj
            </Button>
          ) : (
            <Button variant="outlined" fullWidth component="a" href="/settings">
              Anuluj
            </Button>
          )}
          <Button
            variant="contained"
            color="success"
            type="submit"
            fullWidth
            disabled={isSubmitting || !effectiveSeasonId || seasons.length === 0}
          >
            {isSubmitting ? <CircularProgress size={24} /> : isEdit ? "Zapisz zmiany" : "Zapisz Drużynę"}
          </Button>
        </Box>
      </form>
    </Paper>
  );
}
