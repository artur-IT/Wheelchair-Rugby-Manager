import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Fragment, type ReactNode, useEffect, useMemo, useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import DataLoadAlert from "@/components/ui/DataLoadAlert";
import MutationErrorAlert from "@/components/ui/MutationErrorAlert";
import type { ClubPlayerFormValues } from "@/features/club/lib/clubPersonnelFormSchemas";
import { clubPlayerFormSchema } from "@/features/club/lib/clubPersonnelFormSchemas";
import {
  buildContactMapSearchUrl,
  ClubPersonnelValidationError,
  computeAgeFromIsoDateString,
  extractClubApiErrorMessage,
  parseClubPlayerApiFieldMessages,
  playerNumberToFormValue,
  zodSafeParseResolver,
} from "@/features/club/lib/clubPersonnelHelpers";
import type { ClubPlayerDto } from "@/features/club/components/ClubPage/types";
import { resolvePlaceMapsHref } from "@/lib/addressDisplay";
import { blurActiveElement } from "@/lib/a11y/blurActiveElement";
import { CLUB_PLAYER_CLASSIFICATION_VALUES } from "@/lib/clubSchemas";
import { MAX_LONG_TEXT, MAX_SHORT_TEXT } from "@/lib/validateInputs";
import { sanitizePhone } from "@/lib/validateInputs";

const STATUS_OPTIONS = [
  { value: "ACTIVE" as const, label: "Aktywny" },
  { value: "INACTIVE" as const, label: "Nieaktywny" },
  { value: "GUEST" as const, label: "Gość" },
];

/** Skill ratings 1–5 (optional); labels match NOTES.md. */
const PLAYER_SKILL_RATING_OPTIONS = [1, 2, 3, 4, 5] as const;

const PLAYER_SKILL_FIELDS = [
  { name: "speed" as const, label: "Szybkość" },
  { name: "strength" as const, label: "Siła" },
  { name: "endurance" as const, label: "Wytrzymałość" },
  { name: "technique" as const, label: "Technika" },
  { name: "mentality" as const, label: "Mentalność" },
  { name: "tactics" as const, label: "Taktyka" },
];

/** Narrow player card; maxWidth keeps it inside the viewport on small screens. */
const PLAYER_LIST_TILE_WIDTH_PX = 310;

const statusLabel = (s: ClubPlayerDto["status"] | undefined) =>
  STATUS_OPTIONS.find((o) => o.value === (s ?? "ACTIVE"))?.label ?? s ?? "ACTIVE";

/** Birth date + computed age for list rows (same rules as form helper). */
function playerBirthDisplay(birthDate: string | null | undefined): string {
  if (!birthDate?.trim()) return "—";
  const d = birthDate.slice(0, 10);
  const years = computeAgeFromIsoDateString(`${d}T12:00:00.000Z`);
  return years === null ? d : `${d} (${years} lat)`;
}

/** Single-line address from optional parts. */
function playerAddressLine(p: ClubPlayerDto): string {
  const line1 = p.contactAddress?.trim();
  const cityLine = [p.contactPostalCode?.trim(), p.contactCity?.trim()].filter(Boolean).join(" ");
  const parts = [line1, cityLine].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

/** Same composite address as tournament venue/hotel for `resolvePlaceMapsHref`. */
function playerContactAddressForMaps(p: ClubPlayerDto): string {
  const line1 = p.contactAddress?.trim();
  const cityLine = [p.contactPostalCode?.trim(), p.contactCity?.trim()].filter(Boolean).join(" ");
  return [line1, cityLine].filter(Boolean).join(", ");
}

/** One decimal place for list rows (e.g. 2.0). */
function formatClassificationForList(c: number | null | undefined): string {
  if (c === null || c === undefined) return "—";
  const n = Number(c);
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(1);
}

/**
 * Five hue-separated stops (cool red → orange → gold → lime → deep green) so 1–3 are not all “red-orange”.
 * Values between integers blend the surrounding stops.
 */
const SKILL_RATING_COLOR_STOPS: readonly { pos: number; r: number; g: number; b: number }[] = [
  { pos: 1, r: 183, g: 28, b: 28 },
  { pos: 2, r: 230, g: 81, b: 0 },
  { pos: 3, r: 251, g: 192, b: 45 },
  { pos: 4, r: 139, g: 195, b: 74 },
  { pos: 5, r: 46, g: 125, b: 50 },
];

function skillRatingColor(rating: number): string {
  const x = Math.max(1, Math.min(5, rating));
  const stops = SKILL_RATING_COLOR_STOPS;
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (!a || !b) break;
    if (x <= b.pos) {
      const t = (x - a.pos) / (b.pos - a.pos);
      const lerp = (u: number, v: number) => Math.round(u + (v - u) * t);
      return `rgb(${lerp(a.r, b.r)}, ${lerp(a.g, b.g)}, ${lerp(a.b, b.b)})`;
    }
  }
  const last = stops[stops.length - 1];
  if (last) return `rgb(${last.r}, ${last.g}, ${last.b})`;
  return "rgb(128, 128, 128)";
}

type PlayerSkillFieldName = (typeof PLAYER_SKILL_FIELDS)[number]["name"];

function playerSkillsPresent(p: ClubPlayerDto): { name: PlayerSkillFieldName; label: string; value: number }[] {
  return PLAYER_SKILL_FIELDS.flatMap(({ name, label }) => {
    const v = p[name];
    return typeof v === "number" && Number.isFinite(v) ? [{ name, label, value: v }] : [];
  });
}

/** Label + value block inside expanded accordion panel. */
function PlayerDetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" component="p" sx={{ m: 0, mb: 0.25 }}>
        {label}
      </Typography>
      <Typography variant="body2" component="div" sx={{ wordBreak: "break-word" }}>
        {children}
      </Typography>
    </Box>
  );
}

interface ClubPlayersPersonnelSectionProps {
  clubId: string;
  players: ClubPlayerDto[];
  isLoading: boolean;
  loadError: string | null;
  onRetry: () => void;
}

const emptyPlayerForm = (): ClubPlayerFormValues => ({
  firstName: "",
  lastName: "",
  classification: 0.5,
  number: "-",
  status: "ACTIVE",
  birthDate: null,
  contactEmail: "",
  contactPhone: "",
  contactAddress: "",
  contactCity: "",
  contactPostalCode: "",
  contactMapUrl: "",
  speed: "",
  strength: "",
  endurance: "",
  technique: "",
  mentality: "",
  tactics: "",
});

function mapPlayerToForm(p: ClubPlayerDto): ClubPlayerFormValues {
  return {
    firstName: p.firstName,
    lastName: p.lastName,
    classification: (p.classification ?? 0.5) as (typeof CLUB_PLAYER_CLASSIFICATION_VALUES)[number],
    number: playerNumberToFormValue(p.number),
    status: p.status ?? "ACTIVE",
    birthDate: p.birthDate ? p.birthDate.slice(0, 10) : null,
    contactEmail: p.contactEmail ?? "",
    contactPhone: p.contactPhone ?? "",
    contactAddress: p.contactAddress ?? "",
    contactCity: p.contactCity ?? "",
    contactPostalCode: p.contactPostalCode ?? "",
    contactMapUrl: p.contactMapUrl ?? "",
    speed: p.speed ?? "",
    strength: p.strength ?? "",
    endurance: p.endurance ?? "",
    technique: p.technique ?? "",
    mentality: p.mentality ?? "",
    tactics: p.tactics ?? "",
  };
}

/** API Zod fields use .optional() without null — omit empty strings instead of JSON null. */
function toPlayerApiJson(values: ClubPlayerFormValues) {
  const payload: Record<string, unknown> = {
    firstName: values.firstName,
    lastName: values.lastName,
    classification: values.classification,
    number: values.number,
    status: values.status,
    birthDate: values.birthDate?.trim() ? values.birthDate.slice(0, 10) : null,
    contactEmail: values.contactEmail?.trim() || null,
    contactPhone: values.contactPhone?.trim() || null,
  };
  if (values.contactAddress?.trim()) payload.contactAddress = values.contactAddress.trim();
  if (values.contactCity?.trim()) payload.contactCity = values.contactCity.trim();
  if (values.contactPostalCode?.trim()) payload.contactPostalCode = values.contactPostalCode.trim();
  if (values.contactMapUrl?.trim()) payload.contactMapUrl = values.contactMapUrl.trim();

  for (const key of ["speed", "strength", "endurance", "technique", "mentality", "tactics"] as const) {
    const raw = values[key];
    payload[key] = typeof raw === "number" ? raw : null;
  }

  return payload;
}

export default function ClubPlayersPersonnelSection({
  clubId,
  players,
  isLoading,
  loadError,
  onRetry,
}: ClubPlayersPersonnelSectionProps) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ClubPlayerDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClubPlayerDto | null>(null);

  const form = useForm<ClubPlayerFormValues>({
    resolver: zodSafeParseResolver<ClubPlayerFormValues>(clubPlayerFormSchema),
    defaultValues: emptyPlayerForm(),
  });

  const watchedBirth = useWatch({ control: form.control, name: "birthDate" });
  const watchedAddress = useWatch({ control: form.control, name: "contactAddress" });
  const watchedPostal = useWatch({ control: form.control, name: "contactPostalCode" });
  const watchedCity = useWatch({ control: form.control, name: "contactCity" });

  const ageDisplay = useMemo(() => {
    if (!watchedBirth?.trim()) return "—";
    const years = computeAgeFromIsoDateString(`${watchedBirth}T12:00:00.000Z`);
    return years === null ? "—" : `${years} lat`;
  }, [watchedBirth]);

  useEffect(() => {
    if (!dialogOpen) return;
    const url = buildContactMapSearchUrl({
      address: watchedAddress,
      postalCode: watchedPostal,
      city: watchedCity,
    });
    form.setValue("contactMapUrl", url ?? "", { shouldValidate: false, shouldDirty: false });
  }, [dialogOpen, watchedAddress, watchedPostal, watchedCity, form]);

  useEffect(() => {
    if (!dialogOpen) return;
    if (editing) {
      form.reset(mapPlayerToForm(editing));
      return;
    }
    form.reset(emptyPlayerForm());
  }, [dialogOpen, editing, form]);

  const invalidatePlayersAndTeams = async () => {
    await queryClient.invalidateQueries({ queryKey: ["club", "players", clubId] });
    await queryClient.invalidateQueries({ queryKey: ["club", "teams", clubId] });
  };

  const saveMutation = useMutation({
    mutationFn: async (values: ClubPlayerFormValues) => {
      const json = toPlayerApiJson(values);
      if (editing) {
        const res = await fetch(`/api/club/players/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(json),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const fieldMap = parseClubPlayerApiFieldMessages(data);
          if (fieldMap) throw new ClubPersonnelValidationError(fieldMap);
          throw new Error(extractClubApiErrorMessage(data, "Nie udało się zapisać zawodnika"));
        }
        const data = await res.json();
        return data;
      }
      const res = await fetch(`/api/club/${clubId}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const fieldMap = parseClubPlayerApiFieldMessages(data);
        if (fieldMap) throw new ClubPersonnelValidationError(fieldMap);
        throw new Error(extractClubApiErrorMessage(data, "Nie udało się dodać zawodnika"));
      }
      const data = await res.json();
      return data;
    },
    onMutate: () => {
      form.clearErrors();
    },
    onError: (error) => {
      if (error instanceof ClubPersonnelValidationError) {
        for (const key of Object.keys(error.fieldMessages)) {
          if (key in emptyPlayerForm()) {
            const msg = error.fieldMessages[key];
            if (msg) {
              form.setError(key as keyof ClubPlayerFormValues, { type: "server", message: msg });
            }
          }
        }
      }
    },
    onSuccess: async () => {
      setDialogOpen(false);
      setEditing(null);
      await invalidatePlayersAndTeams();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/club/players/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(extractClubApiErrorMessage(data, "Nie udało się usunąć zawodnika"));
      }
      const data = await res.json();
      return data;
    },
    onSuccess: async () => {
      setDeleteTarget(null);
      await invalidatePlayersAndTeams();
    },
  });

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (loadError) {
    return <DataLoadAlert message={loadError} onRetry={onRetry} />;
  }

  return (
    <>
      {players.length === 0 ? (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                blurActiveElement();
                setDialogOpen(true);
              }}
            >
              Dodaj zawodnika
            </Button>
          }
        >
          Brak zawodników w klubie. Dodaj pierwszą osobę, aby przypisać ją do drużyny.
        </Alert>
      ) : null}

      {deleteMutation.isError && deleteMutation.error instanceof Error ? (
        <Box sx={{ mb: 2 }}>
          <MutationErrorAlert error={deleteMutation.error} fallbackMessage="Nie udało się usunąć zawodnika" />
        </Box>
      ) : null}

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          Lista zawodników
        </Typography>
        <Button
          variant="contained"
          size="small"
          onClick={() => {
            blurActiveElement();
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          + Dodaj zawodnika
        </Button>
      </Box>

      <Stack
        component="ul"
        direction="row"
        flexWrap="wrap"
        spacing={1}
        useFlexGap
        sx={{ listStyle: "none", m: 0, p: 0, alignItems: "flex-start", width: "100%" }}
      >
        {players.map((p) => {
          const shirt = p.number === null || p.number === undefined ? "—" : String(p.number);
          const classificationDisplay = formatClassificationForList(p.classification);
          const skillsRow = playerSkillsPresent(p);
          const mapsHref = resolvePlaceMapsHref({
            mapUrl: p.contactMapUrl ?? undefined,
            name: "",
            address: playerContactAddressForMaps(p),
          });
          return (
            <Accordion
              key={p.id}
              component="li"
              disableGutters
              elevation={0}
              sx={{
                width: PLAYER_LIST_TILE_WIDTH_PX,
                maxWidth: "100%",
                boxSizing: "border-box",
                border: 1,
                borderColor: "divider",
                borderRadius: 2,
                listStyle: "none",
                overflow: "hidden",
                bgcolor: "background.paper",
                boxShadow: 1,
                flexShrink: 0,
                "&:before": { display: "none" },
              }}
            >
              {/* Root is a div so nested Edytuj/Usuń <button> stays valid HTML (accordion region still toggles on click). */}
              <AccordionSummary
                component="div"
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  alignItems: "flex-start",
                  px: 2,
                  py: 1.5,
                  "& .MuiAccordionSummary-content": {
                    flexDirection: "column",
                    alignItems: "stretch",
                    gap: 1.25,
                    my: 0,
                  },
                  "& .MuiAccordionSummary-expandIconWrapper": {
                    alignSelf: "flex-start",
                    pt: 0.25,
                  },
                }}
              >
                <Stack direction="row" alignItems="baseline" flexWrap="wrap" columnGap={1} rowGap={0.5}>
                  <Typography component="span" variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {p.firstName}
                  </Typography>
                  <Typography component="span" variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {p.lastName}
                  </Typography>
                  <Typography component="span" variant="body2" color="text.secondary">
                    {classificationDisplay}
                  </Typography>
                </Stack>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr) auto",
                    columnGap: 2,
                    rowGap: 0.75,
                    alignItems: "center",
                  }}
                >
                  {skillsRow.length ? (
                    skillsRow.map(({ name, label, value }) => (
                      <Fragment key={name}>
                        <Typography variant="body2" color="text.secondary" component="div" sx={{ minWidth: 0 }}>
                          {label}
                        </Typography>
                        <Box
                          component="span"
                          sx={(theme) => {
                            const bg = skillRatingColor(value);
                            return {
                              justifySelf: "end",
                              width: 26,
                              height: 26,
                              boxSizing: "border-box",
                              flexShrink: 0,
                              borderRadius: 0.5,
                              bgcolor: bg,
                              color: theme.palette.getContrastText(bg),
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              typography: "body2",
                              lineHeight: 1,
                            };
                          }}
                        >
                          {value}
                        </Box>
                      </Fragment>
                    ))
                  ) : (
                    <Typography
                      variant="body2"
                      color="text.disabled"
                      sx={{ fontStyle: "italic", gridColumn: "1 / -1" }}
                    >
                      Brak ocenionych umiejętności
                    </Typography>
                  )}
                </Box>
                <Stack direction="row" flexWrap="wrap" gap={1} useFlexGap sx={{ pt: 0.25 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={(e) => {
                      e.stopPropagation();
                      blurActiveElement();
                      setEditing(p);
                      setDialogOpen(true);
                    }}
                  >
                    Edytuj
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    disabled={deleteMutation.isPending && deleteTarget?.id === p.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      blurActiveElement();
                      setDeleteTarget(p);
                    }}
                  >
                    Usuń
                  </Button>
                </Stack>
              </AccordionSummary>
              <AccordionDetails
                sx={{
                  px: 2,
                  pb: 2,
                  pt: 0,
                  borderTop: 1,
                  borderColor: "divider",
                  bgcolor: (theme) => (theme.palette.mode === "dark" ? "action.hover" : theme.palette.grey[50]),
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                    gap: 1.5,
                    pt: 2,
                  }}
                >
                  <PlayerDetailField label="Numer koszulki">{shirt}</PlayerDetailField>
                  <PlayerDetailField label="Status">{statusLabel(p.status ?? "ACTIVE")}</PlayerDetailField>
                  <PlayerDetailField label="Data urodzenia">{playerBirthDisplay(p.birthDate)}</PlayerDetailField>
                  <PlayerDetailField label="Telefon">{p.contactPhone?.trim() || "—"}</PlayerDetailField>
                  <Box sx={{ gridColumn: { xs: "auto", sm: "1 / -1" } }}>
                    <PlayerDetailField label="E-mail">{p.contactEmail?.trim() || "—"}</PlayerDetailField>
                  </Box>
                  <Box sx={{ gridColumn: { xs: "auto", sm: "1 / -1" } }}>
                    <PlayerDetailField label="Adres">{playerAddressLine(p)}</PlayerDetailField>
                  </Box>
                  {mapsHref ? (
                    <Link href={mapsHref} target="_blank" rel="noopener noreferrer">
                      {"Mapa ->"}
                    </Link>
                  ) : (
                    "—"
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Stack>

      <Dialog
        open={dialogOpen}
        onClose={() => {
          if (saveMutation.isPending) return;
          blurActiveElement();
          setDialogOpen(false);
        }}
        fullWidth
        maxWidth="sm"
        disableRestoreFocus
      >
        <DialogTitle>{editing ? "Edytuj zawodnika" : "Nowy zawodnik"}</DialogTitle>
        <DialogContent>
          <Box
            component="form"
            id="club-player-form"
            sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}
            onSubmit={(e) => {
              e.preventDefault();
              void form.handleSubmit((v) => saveMutation.mutate(v))();
            }}
          >
            {saveMutation.error instanceof Error && !(saveMutation.error instanceof ClubPersonnelValidationError) ? (
              <Alert severity="error" sx={{ whiteSpace: "pre-line" }}>
                {saveMutation.error.message}
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
                      inputProps={{ maxLength: MAX_SHORT_TEXT }}
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
                      inputProps={{ maxLength: MAX_SHORT_TEXT }}
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
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
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
                      required
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message ?? "Od 1 do 99 albo znak „-”, jeśli nie ma numeru."}
                      inputProps={{ maxLength: 3 }}
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
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Umiejętności
                </Typography>
                <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.25, mb: 0 }}>
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
                          <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
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
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Dane osobowe
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="birthDate"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      value={field.value ?? ""}
                      label="Data urodzenia (opcjonalnie)"
                      type="date"
                      InputLabelProps={{ shrink: true }}
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
                      inputProps={{ maxLength: MAX_SHORT_TEXT }}
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
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
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
                      inputProps={{ maxLength: MAX_LONG_TEXT }}
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
                      inputProps={{ maxLength: MAX_SHORT_TEXT }}
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
                      InputProps={{ readOnly: true }}
                      helperText="Uzupełnij ulicę, kod i miasto — link zaktualizuje się automatycznie (Google Maps)."
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              blurActiveElement();
              setDialogOpen(false);
            }}
            disabled={saveMutation.isPending}
          >
            Anuluj
          </Button>
          <Button type="submit" form="club-player-form" variant="contained" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <CircularProgress size={20} /> : "Zapisz"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        onClose={() => !deleteMutation.isPending && setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
        loading={deleteMutation.isPending}
        title="Usuń zawodnika"
        description={
          <span>
            Czy na pewno chcesz usunąć{" "}
            <strong>
              {deleteTarget?.firstName} {deleteTarget?.lastName}
            </strong>
            ? Tej operacji nie cofniesz.
          </span>
        }
      />
    </>
  );
}
