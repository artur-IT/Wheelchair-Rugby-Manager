import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Paper,
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
  computeAgeFromIsoDateString,
  extractClubApiErrorMessage,
  playerNumberToFormValue,
  zodSafeParseResolver,
} from "@/features/club/lib/clubPersonnelHelpers";
import type { ClubPlayerDto } from "@/features/club/components/ClubPage/types";
import { CLUB_PLAYER_CLASSIFICATION_VALUES } from "@/lib/clubSchemas";
import { MAX_LONG_TEXT, MAX_SHORT_TEXT } from "@/lib/validateInputs";
import { sanitizePhone } from "@/lib/validateInputs";

const STATUS_OPTIONS = [
  { value: "ACTIVE" as const, label: "Aktywny" },
  { value: "INACTIVE" as const, label: "Nieaktywny" },
  { value: "GUEST" as const, label: "Gość" },
];

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

/** Label + value block for card layout (readable on narrow screens). */
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
        throw new Error(extractClubApiErrorMessage(data, "Nie udało się dodać zawodnika"));
      }
      const data = await res.json();
      return data;
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
            <Button color="inherit" size="small" onClick={() => setDialogOpen(true)}>
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
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          + Dodaj zawodnika
        </Button>
      </Box>

      <Stack component="ul" spacing={2} sx={{ listStyle: "none", m: 0, p: 0 }}>
        {players.map((p) => {
          const fullName = `${p.firstName} ${p.lastName}`.trim();
          const shirt = p.number === null || p.number === undefined ? "—" : String(p.number);
          return (
            <Paper key={p.id} component="li" variant="outlined" sx={{ p: 2, listStyle: "none" }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", sm: "flex-start" }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" component="h3" sx={{ fontWeight: "bold" }}>
                    {fullName}
                  </Typography>
                  <Stack direction="row" useFlexGap flexWrap="wrap" gap={0.75} sx={{ mt: 1 }}>
                    <Chip size="small" variant="outlined" label={`Klasyfikacja: ${p.classification ?? "—"}`} />
                    <Chip size="small" variant="outlined" label={`Numer: ${shirt}`} />
                    <Chip size="small" variant="outlined" label={statusLabel(p.status ?? "ACTIVE")} />
                  </Stack>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                      gap: 2,
                      mt: 1.5,
                      pt: 1.5,
                      borderTop: 1,
                      borderColor: "divider",
                    }}
                  >
                    <PlayerDetailField label="Data urodzenia">{playerBirthDisplay(p.birthDate)}</PlayerDetailField>
                    <PlayerDetailField label="Email">{p.contactEmail?.trim() || "—"}</PlayerDetailField>
                    <PlayerDetailField label="Telefon">{p.contactPhone?.trim() || "—"}</PlayerDetailField>
                    <PlayerDetailField label="Adres (ulica, kod, miasto)">{playerAddressLine(p)}</PlayerDetailField>
                    <PlayerDetailField label="Mapa">
                      {p.contactMapUrl?.trim() ? (
                        <Link href={p.contactMapUrl.trim()} target="_blank" rel="noopener noreferrer">
                          Mapa
                        </Link>
                      ) : (
                        "—"
                      )}
                    </PlayerDetailField>
                  </Box>
                </Box>
                <Stack direction="row" spacing={1} justifyContent={{ xs: "flex-end", sm: "flex-start" }} flexShrink={0}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
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
                    onClick={() => setDeleteTarget(p)}
                  >
                    Usuń
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          );
        })}
      </Stack>

      <Dialog open={dialogOpen} onClose={() => !saveMutation.isPending && setDialogOpen(false)} fullWidth maxWidth="sm">
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
            {saveMutation.error instanceof Error ? <Alert severity="error">{saveMutation.error.message}</Alert> : null}

            <Controller
              name="firstName"
              control={form.control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Imię"
                  required
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                  inputProps={{ maxLength: MAX_SHORT_TEXT }}
                />
              )}
            />
            <Controller
              name="lastName"
              control={form.control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Nazwisko"
                  required
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                  inputProps={{ maxLength: MAX_SHORT_TEXT }}
                />
              )}
            />

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

            <Controller
              name="number"
              control={form.control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  value={field.value ?? "-"}
                  label="Numer koszulki"
                  required
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message ?? "Od 1 do 99 albo znak „-”, jeśli nie ma numeru."}
                  inputProps={{ maxLength: 3 }}
                />
              )}
            />

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

            <Controller
              name="birthDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
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

            <TextField label="Wiek (liczony automatycznie)" value={ageDisplay} disabled fullWidth />

            <Controller
              name="contactEmail"
              control={form.control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  value={field.value ?? ""}
                  label="Email kontaktowy"
                  type="email"
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                  inputProps={{ maxLength: MAX_SHORT_TEXT }}
                />
              )}
            />

            <Controller
              name="contactPhone"
              control={form.control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  value={field.value ?? ""}
                  label="Telefon kontaktowy"
                  inputMode="numeric"
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message ?? "Opcjonalnie — 9 cyfr bez prefiksu kraju."}
                  onChange={(e) => field.onChange(sanitizePhone(e.target.value))}
                />
              )}
            />

            <Controller
              name="contactAddress"
              control={form.control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  value={field.value ?? ""}
                  label="Adres"
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                  inputProps={{ maxLength: MAX_LONG_TEXT }}
                />
              )}
            />

            <Controller
              name="contactCity"
              control={form.control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  value={field.value ?? ""}
                  label="Miasto"
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                  inputProps={{ maxLength: MAX_SHORT_TEXT }}
                />
              )}
            />

            <Controller
              name="contactPostalCode"
              control={form.control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  value={field.value ?? ""}
                  label="Kod pocztowy"
                  placeholder="XX-XXX"
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />

            <Controller
              name="contactMapUrl"
              control={form.control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ""}
                  label="Link do mapy (generowany automatycznie)"
                  fullWidth
                  InputProps={{ readOnly: true }}
                  helperText="Uzupełnij adres, kod i miasto — link zaktualizuje się sam (OpenStreetMap)."
                />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saveMutation.isPending}>
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
