import { memo, useCallback, useEffect, useMemo, type FormEvent } from "react";
import { Controller, type Control, type UseFormReturn, useWatch } from "react-hook-form";
import { Alert, Box, FormControl, Grid, InputLabel, MenuItem, Select, TextField, Typography } from "@mui/material";
import type { ClubPlayerFormValues } from "@/features/club/lib/clubPersonnelFormSchemas";
import {
  buildContactMapSearchUrl,
  ClubPersonnelValidationError,
  computeAgeFromIsoDateString,
} from "@/features/club/lib/clubPersonnelHelpers";
import { todayLocalIsoDate } from "@/lib/dateFormat";
import { CLUB_PLAYER_CLASSIFICATION_VALUES } from "@/lib/clubSchemas";
import { MAX_LONG_TEXT, MAX_SHORT_TEXT } from "@/lib/validateInputs";
import { sanitizePhone } from "@/lib/validateInputs";

export const STATUS_OPTIONS = [
  { value: "ACTIVE" as const, label: "Aktywny" },
  { value: "INACTIVE" as const, label: "Nieaktywny" },
  { value: "GUEST" as const, label: "Gość" },
];

/** Skill ratings 1–5 (optional); labels match NOTES.md. */
const PLAYER_SKILL_RATING_OPTIONS = [1, 2, 3, 4, 5] as const;

export const PLAYER_SKILL_FIELDS = [
  { name: "speed" as const, label: "Szybkość" },
  { name: "strength" as const, label: "Siła" },
  { name: "endurance" as const, label: "Wytrzymałość" },
  { name: "technique" as const, label: "Technika" },
  { name: "mentality" as const, label: "Mentalność" },
  { name: "tactics" as const, label: "Taktyka" },
];

const FORM_ROOT_SX = { mt: 1, display: "flex", flexDirection: "column", gap: 2 } as const;
const SECTION_TITLE_SX = { fontWeight: 600 } as const;
const SKILL_HINT_SX = { mt: 0.25, mb: 0 } as const;
const FIELD_ERROR_SX = { mt: 0.5, ml: 1.5 } as const;

interface ClubPlayerFormProps {
  form: UseFormReturn<ClubPlayerFormValues>;
  saveError: unknown;
  onSubmit: (values: ClubPlayerFormValues) => void;
}

/** Keeps birth-date watch local so other fields do not re-render when age updates. */
function PlayerBirthDateFields({ control }: { control: Control<ClubPlayerFormValues> }) {
  const watchedBirth = useWatch({ control, name: "birthDate" });
  const maxBirthDate = useMemo(() => todayLocalIsoDate(), []);
  const ageDisplay = useMemo(() => {
    if (!watchedBirth?.trim()) return "—";
    const years = computeAgeFromIsoDateString(`${watchedBirth}T12:00:00.000Z`);
    return years === null ? "—" : `${years} lat`;
  }, [watchedBirth]);

  return (
    <>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Controller
          name="birthDate"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              fullWidth
              value={field.value ?? ""}
              label="Data urodzenia (opcjonalnie)"
              type="date"
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { max: maxBirthDate },
              }}
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
              onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
            />
          )}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField fullWidth label="Wiek (liczony automatycznie)" value={ageDisplay} disabled />
      </Grid>
    </>
  );
}

/** Side-effect only — syncs map URL when address fields change without re-rendering the form tree. */
function ContactMapUrlSync({
  control,
  setValue,
}: {
  control: Control<ClubPlayerFormValues>;
  setValue: UseFormReturn<ClubPlayerFormValues>["setValue"];
}) {
  const watchedAddress = useWatch({ control, name: "contactAddress" });
  const watchedPostal = useWatch({ control, name: "contactPostalCode" });
  const watchedCity = useWatch({ control, name: "contactCity" });

  useEffect(() => {
    const url = buildContactMapSearchUrl({
      address: watchedAddress,
      postalCode: watchedPostal,
      city: watchedCity,
    });
    setValue("contactMapUrl", url ?? "", { shouldValidate: false, shouldDirty: false });
  }, [watchedAddress, watchedPostal, watchedCity, setValue]);

  return null;
}

function ClubPlayerForm({ form, saveError, onSubmit }: ClubPlayerFormProps) {
  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void form.handleSubmit(onSubmit)();
    },
    [form, onSubmit]
  );

  return (
    <Box component="form" id="club-player-form" sx={FORM_ROOT_SX} onSubmit={handleSubmit}>
      <ContactMapUrlSync control={form.control} setValue={form.setValue} />

      {saveError instanceof Error && !(saveError instanceof ClubPersonnelValidationError) ? (
        <Alert severity="error" sx={{ whiteSpace: "pre-line" }}>
          {saveError.message}
        </Alert>
      ) : null}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="firstName"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="Imię"
                required
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                slotProps={{ htmlInput: { maxLength: MAX_SHORT_TEXT } }}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="lastName"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="Nazwisko"
                required
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                slotProps={{ htmlInput: { maxLength: MAX_SHORT_TEXT } }}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="classification"
            control={form.control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={Boolean(fieldState.error)}>
                <InputLabel id="classification-label">Klasyfikacja</InputLabel>
                <Select
                  {...field}
                  labelId="classification-label"
                  label="Klasyfikacja"
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                >
                  {CLUB_PLAYER_CLASSIFICATION_VALUES.map((v) => (
                    <MenuItem key={v} value={v}>
                      {v}
                    </MenuItem>
                  ))}
                </Select>
                {fieldState.error ? (
                  <Typography variant="caption" color="error" sx={FIELD_ERROR_SX}>
                    {fieldState.error.message}
                  </Typography>
                ) : null}
              </FormControl>
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="number"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                value={field.value ?? "-"}
                label="Numer koszulki"
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message ?? "Od 1 do 99 albo znak „-”, jeśli nie ma numeru."}
                slotProps={{ htmlInput: { maxLength: 3 } }}
                onFocus={() => {
                  if (field.value === "-") field.onChange("");
                }}
                onBlur={(e) => {
                  const trimmed = e.target.value.trim();
                  if (trimmed === "" || trimmed === "–") field.onChange("-");
                  field.onBlur();
                }}
              />
            )}
          />
        </Grid>

        <Grid size={12}>
          <Typography variant="subtitle2" sx={SECTION_TITLE_SX}>
            Umiejętności
          </Typography>
          <Typography variant="caption" color="text.secondary" component="p" sx={SKILL_HINT_SX}>
            Ocena od 1 do 5 w każdej kategorii (opcjonalnie).
          </Typography>
        </Grid>
        {PLAYER_SKILL_FIELDS.map(({ name, label }) => (
          <Grid key={name} size={{ xs: 12, sm: 6 }}>
            <Controller
              name={name}
              control={form.control}
              render={({ field, fieldState }) => (
                <FormControl fullWidth size="small" required={false} error={Boolean(fieldState.error)}>
                  <InputLabel id={`${name}-label`}>{label}</InputLabel>
                  <Select
                    labelId={`${name}-label`}
                    label={label}
                    required={false}
                    value={field.value === "" ? "" : String(field.value)}
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(v === "" ? "" : Number(v));
                    }}
                  >
                    <MenuItem value="">
                      <em>—</em>
                    </MenuItem>
                    {PLAYER_SKILL_RATING_OPTIONS.map((n) => (
                      <MenuItem key={n} value={String(n)}>
                        {n}
                      </MenuItem>
                    ))}
                  </Select>
                  {fieldState.error ? (
                    <Typography variant="caption" color="error" sx={FIELD_ERROR_SX}>
                      {fieldState.error.message}
                    </Typography>
                  ) : null}
                </FormControl>
              )}
            />
          </Grid>
        ))}

        <Grid size={12}>
          <Controller
            name="status"
            control={form.control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={Boolean(fieldState.error)}>
                <InputLabel id="status-label">Status</InputLabel>
                <Select {...field} labelId="status-label" label="Status" value={field.value}>
                  {STATUS_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </Grid>

        <Grid size={12}>
          <Typography variant="subtitle2" sx={SECTION_TITLE_SX}>
            Dane osobowe
          </Typography>
        </Grid>

        <PlayerBirthDateFields control={form.control} />

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="contactEmail"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                value={field.value ?? ""}
                label="E-mail kontaktowy"
                type="email"
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                slotProps={{ htmlInput: { maxLength: MAX_SHORT_TEXT } }}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="contactPhone"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                value={field.value ?? ""}
                label="Telefon kontaktowy"
                inputMode="numeric"
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message ?? "Opcjonalnie — 9 cyfr bez prefiksu kraju."}
                onChange={(e) => field.onChange(sanitizePhone(e.target.value))}
              />
            )}
          />
        </Grid>

        <Grid size={12}>
          <Typography variant="subtitle2" sx={SECTION_TITLE_SX}>
            Dane teleadresowe
          </Typography>
        </Grid>

        <Grid size={12}>
          <Controller
            name="contactAddress"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                value={field.value ?? ""}
                label="Ulica"
                placeholder="Ulica"
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                slotProps={{ htmlInput: { maxLength: MAX_LONG_TEXT } }}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="contactPostalCode"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                value={field.value ?? ""}
                label="Kod pocztowy"
                placeholder="XX-XXX"
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="contactCity"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                value={field.value ?? ""}
                label="Miasto"
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                slotProps={{ htmlInput: { maxLength: MAX_SHORT_TEXT } }}
              />
            )}
          />
        </Grid>

        <Grid size={12}>
          <Controller
            name="contactMapUrl"
            control={form.control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                value={field.value ?? ""}
                label="Link do Mapy"
                slotProps={{ input: { readOnly: true } }}
                helperText="Uzupełnij ulicę, kod i miasto — link zaktualizuje się automatycznie (Google Maps)."
              />
            )}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default memo(ClubPlayerForm);
