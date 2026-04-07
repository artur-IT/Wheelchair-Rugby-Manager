import { useState, useEffect, useMemo, type ChangeEvent } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "@/lib/zodPl";
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
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import AppShell from "@/components/AppShell/AppShell";
import TeamCoachSection from "@/features/teams/components/Team/TeamForm/TeamCoachSection";
import TeamContactSection from "@/features/teams/components/Team/TeamForm/TeamContactSection";
import TeamPlayersSection from "@/features/teams/components/Team/TeamForm/TeamPlayersSection";
import QueryProvider from "@/components/QueryProvider/QueryProvider";
import TeamRefereeSection from "@/features/teams/components/Team/TeamForm/TeamRefereeSection";
import TeamStaffSection from "@/features/teams/components/Team/TeamForm/TeamStaffSection";
import { buildPlayerPayloadFromRow, normalizeText } from "@/features/teams/components/Team/shared/teamFormUtils";
import { useEditableRows } from "@/features/teams/components/Team/shared/useEditableRows";
import DataLoadAlert from "@/components/ui/DataLoadAlert";
import MutationErrorAlert from "@/components/ui/MutationErrorAlert";
import { createPersonnel, fetchPersonnelBySeason, updatePersonnel } from "@/lib/api/personnel";
import { focusFirstFieldError } from "@/lib/forms/focusFirstFieldError";
import { fetchSeasonsList } from "@/lib/api/seasons";
import { createTeam, updateTeamById } from "@/lib/api/teams";
import { queryKeys } from "@/lib/queryKeys";
import type { Team } from "@/types";
import { ApiValidationError, firstApiFieldErrorKey } from "@/lib/apiHttp";
import { blurActiveElement } from "@/lib/a11y/blurActiveElement";
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
  playerClassificationSchema,
  playerNumberSchema,
  MAX_SHORT_TEXT,
} from "@/lib/validateInputs";

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

export type TeamFormValues = z.infer<typeof teamSchema>;

const requiredFieldSx = {
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "warning.light",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "warning.main",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "primary.main",
    borderWidth: "1px",
  },
};

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

interface TeamPersonnelLike {
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | number | null;
}

interface ResolvePersonnelIdParams {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  initialId?: string;
  initialPerson?: TeamPersonnelLike;
  seasonId: string;
  endpoint: "/api/coaches" | "/api/referees";
}

const normalizeComparableEmail = (value?: string | null) => normalizeText(value).toLowerCase() || undefined;
const normalizeComparablePhone = (value?: string | number | null) =>
  sanitizePhone(value != null ? String(value) : "") || undefined;

function findPersonnelByIdentity(
  people: TeamPersonnelLike[],
  firstName: string,
  lastName: string,
  email?: string,
  phone?: string
): string | undefined {
  const normalizedEmail = normalizeComparableEmail(email);
  const normalizedPhone = normalizeComparablePhone(phone);

  const byPhone = normalizedPhone
    ? people.find((person) => normalizeComparablePhone(person.phone) === normalizedPhone)?.id
    : undefined;
  if (byPhone) return byPhone;

  const byNameAndEmail =
    normalizedEmail &&
    people.find(
      (person) =>
        normalizeText(person.firstName) === firstName &&
        normalizeText(person.lastName) === lastName &&
        normalizeComparableEmail(person.email) === normalizedEmail
    )?.id;
  if (byNameAndEmail) return byNameAndEmail;

  return people.find(
    (person) => normalizeText(person.firstName) === firstName && normalizeText(person.lastName) === lastName
  )?.id;
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

const toPlayerRow = (player: Team["players"][number]): PlayerRow => ({
  id: player.id,
  firstName: player.firstName ?? "",
  lastName: player.lastName ?? "",
  classification: player.classification != null ? String(player.classification) : "",
  number: player.number != null ? String(player.number) : "",
});

const toStaffRow = (staffMember: Team["staff"][number]): StaffRow => ({
  id: staffMember.id,
  firstName: staffMember.firstName ?? "",
  lastName: staffMember.lastName ?? "",
});

const toDefaultValues = (team: Team): TeamFormValues => ({
  name: team.name ?? "",
  address: team.address ?? "",
  city: team.city ?? "",
  postalCode: team.postalCode ?? "",
  websiteUrl: team.websiteUrl ?? "",
  contactFirstName: team.contactFirstName ?? "",
  contactLastName: team.contactLastName ?? "",
  contactEmail: team.contactEmail ?? "",
  contactPhone: team.contactPhone ?? "",
  coachFirstName: team.coach?.firstName ?? "",
  coachLastName: team.coach?.lastName ?? "",
  coachEmail: team.coach?.email ?? "",
  coachPhone: team.coach?.phone != null ? String(team.coach.phone) : "",
  refereeFirstName: team.referee?.firstName ?? "",
  refereeLastName: team.referee?.lastName ?? "",
  refereeEmail: team.referee?.email ?? "",
  refereePhone: team.referee?.phone != null ? String(team.referee.phone) : "",
  staffFirstName: "",
  staffLastName: "",
});

const emptyTeamFormValues: TeamFormValues = {
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
  coachEmail: "",
  coachPhone: "",
  websiteUrl: "",
  refereeFirstName: "",
  refereeLastName: "",
  refereeEmail: "",
  refereePhone: "",
  staffFirstName: "",
  staffLastName: "",
};

function resolveEffectiveSeasonId(seasonId: string, isEdit: Team | false) {
  return seasonId || (isEdit ? isEdit.seasonId : "");
}

async function resolvePersonnelId({
  firstName,
  lastName,
  email,
  phone,
  initialId,
  initialPerson,
  seasonId,
  endpoint,
}: ResolvePersonnelIdParams): Promise<string | undefined> {
  const fn = normalizeText(firstName);
  const ln = normalizeText(lastName);
  const effectiveInitialId = initialId || initialPerson?.id;
  if (!fn || !ln) return effectiveInitialId;

  const normalizedEmail = normalizeComparableEmail(email);
  const normalizedPhone = normalizeComparablePhone(phone);
  const matchesInitialByIdentity =
    Boolean(effectiveInitialId) &&
    fn === normalizeText(initialPerson?.firstName) &&
    ln === normalizeText(initialPerson?.lastName);

  if (matchesInitialByIdentity) {
    const supportsUpdateEndpoint = endpoint === "/api/referees" || endpoint === "/api/coaches";
    if (effectiveInitialId && supportsUpdateEndpoint && normalizedPhone) {
      const existingPersonnel = await fetchPersonnelBySeason(endpoint, seasonId, "Nie udało się pobrać osób");
      const initialStillExists = existingPersonnel.some((person) => person.id === effectiveInitialId);
      const matchedId = initialStillExists
        ? effectiveInitialId
        : findPersonnelByIdentity(existingPersonnel, fn, ln, normalizedEmail, normalizedPhone);

      if (matchedId) {
        await updatePersonnel(endpoint, matchedId, {
          firstName: fn,
          lastName: ln,
          email: normalizedEmail,
          phone: normalizedPhone,
        });
        return matchedId;
      }

      const createdPerson = await createPersonnel(endpoint, {
        firstName: fn,
        lastName: ln,
        email: normalizedEmail,
        phone: normalizedPhone,
        seasonId,
      });
      return createdPerson.id;
    }
    return effectiveInitialId;
  }

  const createdPerson = await createPersonnel(endpoint, {
    firstName: fn,
    lastName: ln,
    email: normalizedEmail,
    phone: normalizedPhone,
    seasonId,
  }).catch((e: unknown) => {
    if (e instanceof ApiValidationError) {
      throw new ApiValidationError(e.message, e.fieldErrors, endpoint);
    }
    throw e;
  });

  return createdPerson.id;
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
  const [playerClassificationErrors, setPlayerClassificationErrors] = useState<Record<string, string>>({});
  const [playerNumberErrors, setPlayerNumberErrors] = useState<Record<string, string>>({});
  const {
    rows: players,
    setRows: setPlayers,
    addRow: addPlayerRow,
    removeRow: removePlayerRow,
    updateRow: updatePlayerRow,
  } = useEditableRows<PlayerRow>();
  const {
    rows: staff,
    setRows: setStaff,
    addRow: addStaffRow,
    removeRow: removeStaffRow,
    updateRow: updateStaffRow,
  } = useEditableRows<StaffRow>();

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

  const effectiveSeasonId = resolveEffectiveSeasonId(seasonId, isEdit);

  const addPlayer = () =>
    addPlayerRow({ id: crypto.randomUUID(), firstName: "", lastName: "", classification: "", number: "" });

  const removePlayer = (id: string) => {
    removePlayerRow(id);
    setPlayerClassificationErrors((prev) => {
      if (!prev[id]) return prev;
      return Object.fromEntries(Object.entries(prev).filter(([key]) => key !== id));
    });
    setPlayerNumberErrors((prev) => {
      if (!prev[id]) return prev;
      return Object.fromEntries(Object.entries(prev).filter(([key]) => key !== id));
    });
  };
  const updatePlayer = (id: string, field: keyof PlayerRow, value: string) =>
    updatePlayerRow(id, (player) => ({ ...player, [field]: value }));

  const validatePlayers = () => {
    const nextClassificationErrors: Record<string, string> = {};
    const nextNumberErrors: Record<string, string> = {};
    for (const player of players) {
      const hasAnyValue =
        normalizeText(player.firstName) ||
        normalizeText(player.lastName) ||
        normalizeText(player.classification) ||
        normalizeText(player.number);
      if (!hasAnyValue) continue;

      const parsedClassification = player.classification.trim()
        ? Number(player.classification.trim().replace(",", "."))
        : undefined;
      const result = playerClassificationSchema.optional().safeParse(parsedClassification);
      if (!result.success) {
        nextClassificationErrors[player.id] = result.error.issues[0]?.message ?? "Nieprawidłowa klasyfikacja";
      }

      const parsedNumber = player.number.trim() ? Number(player.number.trim()) : undefined;
      const numberResult = playerNumberSchema.optional().safeParse(parsedNumber);
      if (!numberResult.success) {
        nextNumberErrors[player.id] = numberResult.error.issues[0]?.message ?? "Nieprawidłowy numer";
      }
    }

    setPlayerClassificationErrors(nextClassificationErrors);
    setPlayerNumberErrors(nextNumberErrors);
    return Object.keys(nextClassificationErrors).length === 0 && Object.keys(nextNumberErrors).length === 0;
  };

  const addStaff = () => addStaffRow({ id: crypto.randomUUID(), firstName: "", lastName: "" });
  const removeStaff = (id: string) => removeStaffRow(id);
  const updateStaff = (id: string, field: keyof StaffRow, value: string) =>
    updateStaffRow(id, (staffMember) => ({ ...staffMember, [field]: value }));

  const defaultFormValues: TeamFormValues = isEdit ? toDefaultValues(initialTeam) : emptyTeamFormValues;

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, touchedFields, isSubmitting },
    reset,
  } = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema as never),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    if (!seasons.length) return;
    if (isEdit && initialTeam) {
      setSeasonId(initialTeam.seasonId ?? "");
      setPlayers((initialTeam.players ?? []).map(toPlayerRow));
      setStaff((initialTeam.staff ?? []).map(toStaffRow));
      reset(toDefaultValues(initialTeam));
      setPlayerClassificationErrors({});
      setPlayerNumberErrors({});
    } else if (seasons.length > 0 && !isEdit) {
      setSeasonId(seasons[0].id);
      setPlayerClassificationErrors({});
      setPlayerNumberErrors({});
    }
  }, [seasons, isEdit, initialTeam, reset, setPlayers, setStaff]);

  const submitMutation = useMutation({
    mutationFn: async (data: TeamFormValues) => {
      const eff = resolveEffectiveSeasonId(seasonId, isEdit);
      if (!eff) {
        throw new Error("Wybierz sezon przed zapisaniem drużyny.");
      }

      const coachId = await resolvePersonnelId({
        firstName: data.coachFirstName,
        lastName: data.coachLastName,
        email: data.coachEmail,
        phone: data.coachPhone,
        initialId: isEdit ? (initialTeam.coachId ?? undefined) : undefined,
        initialPerson: isEdit ? initialTeam.coach : undefined,
        seasonId: eff,
        endpoint: "/api/coaches",
      });

      const refereeId = await resolvePersonnelId({
        firstName: data.refereeFirstName,
        lastName: data.refereeLastName,
        email: data.refereeEmail,
        phone: data.refereePhone,
        initialId: isEdit ? (initialTeam.refereeId ?? undefined) : undefined,
        initialPerson: isEdit ? initialTeam.referee : undefined,
        seasonId: eff,
        endpoint: "/api/referees",
      });

      const staffPayload = staff
        .filter((s) => normalizeText(s.firstName) && normalizeText(s.lastName))
        .map((s) => ({ firstName: normalizeText(s.firstName), lastName: normalizeText(s.lastName) }));
      const playersPayload = players
        .filter((p) => normalizeText(p.firstName) && normalizeText(p.lastName))
        .map(buildPlayerPayloadFromRow);

      const websiteUrl = normalizeText(data.websiteUrl) || undefined;
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
      const eff = resolveEffectiveSeasonId(seasonId, isEdit);
      if (eff) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.seasons.list() });
        void queryClient.invalidateQueries({ queryKey: queryKeys.teams.bySeason(eff) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.referees.bySeason(eff) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.season(eff) });
      }
      if (initialTeam?.id) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.teams.detail(initialTeam.id) });
      }
      // Prevent focus from staying on an element inside a dialog/island that is about to be hidden.
      blurActiveElement();
      if (onSuccess) {
        onSuccess(updated);
      } else {
        redirectToSettings();
      }
    },
    onError: (error) => {
      if (!(error instanceof ApiValidationError) || !error.fieldErrors) return;
      const key = firstApiFieldErrorKey(error.fieldErrors);
      if (!key) return;

      if (key === "seasonId") {
        document.getElementById("season-select")?.focus();
        return;
      }

      const coachMap: Record<string, keyof TeamFormValues> = {
        firstName: "coachFirstName",
        lastName: "coachLastName",
        email: "coachEmail",
        phone: "coachPhone",
      };
      const refereeMap: Record<string, keyof TeamFormValues> = {
        firstName: "refereeFirstName",
        lastName: "refereeLastName",
        email: "refereeEmail",
        phone: "refereePhone",
      };

      const map = error.context === "/api/referees" ? refereeMap : coachMap;
      const field = map[key];
      if (field) setFocus(field);
    },
  });

  const onSubmit = (data: TeamFormValues) => {
    if (!validatePlayers()) return;
    submitMutation.mutate(data);
  };
  const onInvalid = (invalidErrors: FieldErrors<TeamFormValues>) => {
    focusFirstFieldError(invalidErrors, setFocus);
  };

  const makePhoneField = (name: "contactPhone" | "coachPhone" | "refereePhone") => {
    const field = register(name);
    return {
      ...field,
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        e.target.value = sanitizePhone(e.target.value);
        return field.onChange(e);
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

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
        {/* Season selector */}
        <FormControl fullWidth sx={{ mb: 3, ...requiredFieldSx }} error={seasons.length === 0}>
          <InputLabel>Sezon</InputLabel>
          <Select
            label="Sezon"
            value={seasonId ?? ""}
            onChange={(e: SelectChangeEvent) => setSeasonId(e.target.value)}
            readOnly={isEdit && seasons.length <= 1}
            inputProps={{ id: "season-select" }}
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
              error={Boolean(touchedFields.name && errors.name)}
              helperText={touchedFields.name ? errors.name?.message : undefined}
              sx={requiredFieldSx}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Adres"
              {...register("address")}
              error={Boolean(touchedFields.address && errors.address)}
              helperText={touchedFields.address ? errors.address?.message : undefined}
              sx={requiredFieldSx}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 8 }}>
            <TextField
              fullWidth
              label="Miasto"
              {...register("city")}
              error={Boolean(touchedFields.city && errors.city)}
              helperText={touchedFields.city ? errors.city?.message : undefined}
              sx={requiredFieldSx}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="Kod pocztowy"
              placeholder="00-000"
              {...register("postalCode")}
              error={Boolean(touchedFields.postalCode && errors.postalCode)}
              helperText={touchedFields.postalCode ? errors.postalCode?.message : undefined}
              sx={requiredFieldSx}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Strona internetowa (opcjonalnie)"
              {...register("websiteUrl")}
              error={Boolean(touchedFields.websiteUrl && errors.websiteUrl)}
              helperText={touchedFields.websiteUrl ? errors.websiteUrl?.message : undefined}
            />
          </Grid>
        </Grid>

        <TeamContactSection
          register={register}
          errors={errors}
          touchedFields={touchedFields}
          contactPhoneField={contactPhoneField}
          requiredFieldSx={requiredFieldSx}
        />

        <Divider sx={{ my: 2 }} />

        <TeamCoachSection
          register={register}
          errors={errors}
          touchedFields={touchedFields}
          coachPhoneField={coachPhoneField}
          requiredFieldSx={requiredFieldSx}
        />

        <TeamRefereeSection
          register={register}
          errors={errors}
          touchedFields={touchedFields}
          refereePhoneField={refereePhoneField}
        />

        <Divider sx={{ my: 2 }} />

        <TeamStaffSection staff={staff} updateStaff={updateStaff} removeStaff={removeStaff} addStaff={addStaff} />
        <TeamPlayersSection
          players={players}
          updatePlayer={(id, field, value) => {
            updatePlayer(id, field, value);
            if (field === "classification") {
              setPlayerClassificationErrors((prev) => {
                if (!prev[id]) return prev;
                return Object.fromEntries(Object.entries(prev).filter(([key]) => key !== id));
              });
            }
            if (field === "number") {
              setPlayerNumberErrors((prev) => {
                if (!prev[id]) return prev;
                return Object.fromEntries(Object.entries(prev).filter(([key]) => key !== id));
              });
            }
          }}
          removePlayer={removePlayer}
          addPlayer={addPlayer}
          requiredFieldSx={requiredFieldSx}
          classificationErrors={playerClassificationErrors}
          numberErrors={playerNumberErrors}
        />

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
