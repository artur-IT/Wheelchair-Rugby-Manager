import React, { useState, useEffect, useMemo } from "react";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import AppShell from "@/components/AppShell/AppShell";
import QueryProvider from "@/components/QueryProvider/QueryProvider";
import DataLoadAlert from "@/components/ui/DataLoadAlert";
import MutationErrorAlert from "@/components/ui/MutationErrorAlert";
import { createPersonnel } from "@/lib/api/personnel";
import { fetchSeasonsList } from "@/lib/api/seasons";
import { createTeam, updateTeamById } from "@/lib/api/teams";
import { queryKeys } from "@/lib/queryKeys";
import type { Team } from "@/types";
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

function redirectToSettings() {
  window.location.assign("/settings");
}

export default function TeamForm() {
  return (
    <QueryProvider>
      <ThemeRegistry>
        <AppShell currentPath="/settings">
          <TeamFormContent />
        </AppShell>
      </ThemeRegistry>
    </QueryProvider>
  );
}

export function TeamFormContent({ mode = "create", initialTeam = null, onSuccess, onCancel }: TeamFormContentProps) {
  const queryClient = useQueryClient();
  const isEdit = mode === "edit" && initialTeam;

  const [seasonId, setSeasonId] = useState<string>("");
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [staff, setStaff] = useState<StaffRow[]>([]);

  const {
    data: seasonsData,
    isPending: loadingSeasons,
    isError: seasonsQueryFailed,
    error: seasonsQueryError,
    refetch: refetchSeasons,
  } = useQuery({
    queryKey: queryKeys.seasons.list(),
    queryFn: ({ signal }) => fetchSeasonsList(signal),
  });

  const seasons = useMemo(() => seasonsData ?? [], [seasonsData]);
  const seasonsLoadError = seasonsQueryFailed && seasonsQueryError instanceof Error ? seasonsQueryError.message : null;

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

  useEffect(() => {
    if (!seasons.length) return;
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
    } else if (seasons.length > 0 && !isEdit) {
      setSeasonId(seasons[0].id);
    }
  }, [seasons, isEdit, initialTeam, reset]);

  const submitMutation = useMutation({
    mutationFn: async (data: TeamFormValues) => {
      const eff = seasonId || (isEdit && initialTeam ? initialTeam.seasonId : "");
      if (!eff) {
        throw new Error("Wybierz sezon przed zapisaniem drużyny.");
      }

      let coachId: string | undefined = isEdit && initialTeam ? (initialTeam.coachId ?? undefined) : undefined;
      let refereeId: string | undefined = isEdit && initialTeam ? (initialTeam.refereeId ?? undefined) : undefined;

      if (data.coachFirstName?.trim() && data.coachLastName?.trim()) {
        const fn = (data.coachFirstName ?? "").trim();
        const ln = (data.coachLastName ?? "").trim();
        const email = (data.coachEmail ?? "").trim() || null;
        const phone = (data.coachPhone ?? "").trim() || null;
        const matchesInitialCoach =
          isEdit &&
          initialTeam &&
          Boolean(initialTeam.coachId) &&
          fn === (initialTeam.coach?.firstName ?? "").trim() &&
          ln === (initialTeam.coach?.lastName ?? "").trim() &&
          email === ((initialTeam.coach?.email ?? "").trim() || null) &&
          phone === ((initialTeam.coach?.phone != null ? String(initialTeam.coach.phone) : "").trim() || null);

        if (matchesInitialCoach) {
          coachId = initialTeam?.coachId ?? undefined;
        } else {
          const createdCoach = await createPersonnel("/api/coaches", {
            firstName: fn,
            lastName: ln,
            email,
            phone,
            seasonId: eff,
          });
          coachId = createdCoach.id;
        }
      }

      if (data.refereeFirstName?.trim() && data.refereeLastName?.trim()) {
        const fn = (data.refereeFirstName ?? "").trim();
        const ln = (data.refereeLastName ?? "").trim();
        const email = (data.refereeEmail ?? "").trim() || null;
        const phone = (data.refereePhone ?? "").trim() || null;
        const matchesInitialReferee =
          isEdit &&
          initialTeam &&
          Boolean(initialTeam.refereeId) &&
          fn === (initialTeam.referee?.firstName ?? "").trim() &&
          ln === (initialTeam.referee?.lastName ?? "").trim() &&
          email === ((initialTeam.referee?.email ?? "").trim() || null) &&
          phone === ((initialTeam.referee?.phone != null ? String(initialTeam.referee.phone) : "").trim() || null);

        if (matchesInitialReferee) {
          refereeId = initialTeam?.refereeId ?? undefined;
        } else {
          const createdReferee = await createPersonnel("/api/referees", {
            firstName: fn,
            lastName: ln,
            email,
            phone,
            seasonId: eff,
          });
          refereeId = createdReferee.id;
        }
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
        seasonId: eff,
        coachId,
        refereeId,
        staff: staffPayload.length > 0 ? staffPayload : undefined,
        players: playersPayload,
      };

      if (isEdit && initialTeam) {
        return updateTeamById(initialTeam.id, body);
      }

      return createTeam(body);
    },
    onSuccess: (updated) => {
      const eff = seasonId || (isEdit && initialTeam ? initialTeam.seasonId : "");
      if (eff) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.seasons.list() });
        void queryClient.invalidateQueries({ queryKey: queryKeys.teams.bySeason(eff) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.referees.bySeason(eff) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.season(eff) });
      }
      if (initialTeam?.id) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.teams.detail(initialTeam.id) });
      }
      if (onSuccess) {
        onSuccess(updated);
      } else {
        redirectToSettings();
      }
    },
  });

  const onSubmit = (data: TeamFormValues) => {
    submitMutation.mutate(data);
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

      {seasonsLoadError ? (
        <DataLoadAlert message={seasonsLoadError} onRetry={() => void refetchSeasons()} sx={{ mb: 2 }} />
      ) : null}

      {submitMutation.isError ? (
        <Box sx={{ mb: 2 }}>
          <MutationErrorAlert error={submitMutation.error} fallbackMessage="Nie udało się zapisać drużyny." />
        </Box>
      ) : null}

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
              {...register("coachLastName")}
              error={!!errors.coachLastName}
              helperText={errors.coachLastName?.message}
              sx={requiredFieldSx}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Email"
              {...register("coachEmail")}
              error={!!errors.coachEmail}
              helperText={errors.coachEmail?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
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
              label="Email (opcjonalnie)"
              {...register("refereeEmail")}
              error={!!errors.refereeEmail}
              helperText={errors.refereeEmail?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
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
                inputProps={{ inputMode: "decimal" }}
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
                inputProps={{ inputMode: "numeric" }}
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
            disabled={isSubmitting || submitMutation.isPending || !effectiveSeasonId || seasons.length === 0}
          >
            {isSubmitting || submitMutation.isPending ? (
              <CircularProgress size={24} />
            ) : isEdit ? (
              "Zapisz zmiany"
            ) : (
              "Zapisz Drużynę"
            )}
          </Button>
        </Box>
      </form>
    </Paper>
  );
}
