import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import DataLoadAlert from "@/components/ui/DataLoadAlert";
import MutationErrorAlert from "@/components/ui/MutationErrorAlert";
import type { ClubSimplePersonFormValues } from "@/features/club/lib/clubPersonnelFormSchemas";
import {
  type ClubPersonnelZodSchema,
  displayOptionalLastName,
  extractClubApiErrorMessage,
  zodSafeParseResolver,
} from "@/features/club/lib/clubPersonnelHelpers";
import PersonnelTable from "@/features/settings/components/SettingsPage/PersonnelTable";
import type { Person } from "@/types";
import { blurActiveElement } from "@/lib/a11y/blurActiveElement";
import { MAX_SHORT_TEXT } from "@/lib/validateInputs";
import { sanitizePhone } from "@/lib/validateInputs";

export interface ClubSimpleMemberRow {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
}

export interface ClubSimpleMemberSectionConfig {
  listTitle: string;
  emptyMessage: string;
  dialogAddTitle: string;
  dialogEditTitle: string;
  deleteDialogTitle: string;
  queryKey: (clubId: string) => readonly unknown[];
  postUrl: (clubId: string) => string;
  putUrl: (id: string) => string;
  deleteUrl: (id: string) => string;
  formSchema: ClubPersonnelZodSchema;
  /** Extra JSON fields for POST only (e.g. staff role). */
  createExtras?: Record<string, unknown>;
  showEmailField: boolean;
  lastNameRequired: boolean;
}

interface ClubSimpleMemberPersonnelSectionProps {
  clubId: string;
  config: ClubSimpleMemberSectionConfig;
  members: ClubSimpleMemberRow[];
  isLoading: boolean;
  loadError: string | null;
  onRetry: () => void;
}

const emptyForm: ClubSimplePersonFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  notes: "",
};

export default function ClubSimpleMemberPersonnelSection({
  clubId,
  config,
  members,
  isLoading,
  loadError,
  onRetry,
}: ClubSimpleMemberPersonnelSectionProps) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ClubSimpleMemberRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClubSimpleMemberRow | null>(null);

  const form = useForm<ClubSimplePersonFormValues>({
    resolver: zodSafeParseResolver<ClubSimplePersonFormValues>(config.formSchema),
    defaultValues: emptyForm,
  });

  useEffect(() => {
    if (!dialogOpen) return;
    if (editing) {
      form.reset({
        firstName: editing.firstName,
        lastName: editing.lastName ?? "",
        email: editing.email ?? "",
        phone: editing.phone ?? "",
        notes: editing.notes ?? "",
      });
      return;
    }
    form.reset(emptyForm);
  }, [dialogOpen, editing, form]);

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: [...config.queryKey(clubId)],
    });

  const saveMutation = useMutation({
    mutationFn: async (values: ClubSimplePersonFormValues) => {
      const parseJsonSafely = async (res: Response): Promise<Record<string, unknown> | null> => {
        if (res.status === 204) return null;
        const contentType = res.headers.get("content-type")?.toLowerCase() ?? "";
        const contentLength = res.headers.get("content-length");
        if (!contentType.includes("application/json")) return null;
        if (contentLength === "0") return null;
        try {
          return (await res.json()) as Record<string, unknown>;
        } catch {
          return null;
        }
      };

      const body = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email || null,
        phone: values.phone || null,
        notes: values.notes || null,
      };
      if (editing) {
        const res = await fetch(config.putUrl(editing.id), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await parseJsonSafely(res);
        if (!res.ok) throw new Error(extractClubApiErrorMessage(data, "Nie udało się zapisać zmian"));
        return data;
      }
      const res = await fetch(config.postUrl(clubId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, ...config.createExtras }),
      });
      const data = await parseJsonSafely(res);
      if (!res.ok) throw new Error(extractClubApiErrorMessage(data, "Nie udało się dodać osoby"));
      return data;
    },
    onSuccess: async () => {
      setDialogOpen(false);
      setEditing(null);
      await invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(config.deleteUrl(id), { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(extractClubApiErrorMessage(data, "Nie udało się usunąć"));
      }
      // Handle 204 No Content or empty body gracefully
      const text = await res.text();
      return text ? JSON.parse(text) : null;
    },
    onSuccess: async () => {
      setDeleteTarget(null);
      await invalidate();
    },
  });

  const tableRows: Person[] = useMemo(
    () =>
      members.map((m) => ({
        id: m.id,
        firstName: m.firstName,
        lastName: displayOptionalLastName(m.lastName),
        email: m.email ?? undefined,
        phone: m.phone ?? "",
        notes: m.notes ?? undefined,
      })),
    [members]
  );

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
      {members.length === 0 ? (
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
              Dodaj osobę
            </Button>
          }
        >
          {config.emptyMessage}
        </Alert>
      ) : null}

      {deleteMutation.isError && deleteMutation.error instanceof Error ? (
        <Box sx={{ mb: 2 }}>
          <MutationErrorAlert error={deleteMutation.error} fallbackMessage="Nie udało się usunąć" />
        </Box>
      ) : null}

      <PersonnelTable
        title={config.listTitle}
        data={tableRows}
        onAddClick={() => {
          blurActiveElement();
          setEditing(null);
          setDialogOpen(true);
        }}
        onEdit={(person) => {
          const row = members.find((m) => m.id === person.id);
          if (!row) return;
          blurActiveElement();
          setEditing(row);
          setDialogOpen(true);
        }}
        onDelete={(person) => {
          const row = members.find((m) => m.id === person.id);
          if (!row) return;
          blurActiveElement();
          setDeleteTarget(row);
        }}
        deletingId={deleteMutation.isPending ? (deleteTarget?.id ?? null) : null}
      />

      <Dialog
        open={dialogOpen}
        onClose={() => {
          if (saveMutation.isPending) return;
          blurActiveElement();
          setDialogOpen(false);
        }}
        fullWidth
        maxWidth="xs"
        disableRestoreFocus
      >
        <DialogTitle>{editing ? config.dialogEditTitle : config.dialogAddTitle}</DialogTitle>
        <DialogContent>
          <Box
            component="form"
            id="club-simple-member-form"
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
                  value={field.value ?? ""}
                  label="Nazwisko"
                  required={config.lastNameRequired}
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                  inputProps={{ maxLength: MAX_SHORT_TEXT }}
                />
              )}
            />
            {config.showEmailField ? (
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ""}
                    label="E-mail"
                    type="email"
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    inputProps={{ maxLength: MAX_SHORT_TEXT }}
                  />
                )}
              />
            ) : null}
            <Controller
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  value={field.value ?? ""}
                  label="Telefon"
                  placeholder="9 cyfr"
                  inputMode="numeric"
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message ?? "Opcjonalnie — wpisz 9 cyfr (bez przedrostka kraju)."}
                  onChange={(e) => field.onChange(sanitizePhone(e.target.value))}
                />
              )}
            />
            <Controller
              name="notes"
              control={form.control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  value={field.value ?? ""}
                  label="Uwagi"
                  placeholder="Dodatkowe informacje o osobie"
                  multiline
                  rows={3}
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                  inputProps={{ maxLength: 500 }}
                />
              )}
            />
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
          <Button type="submit" form="club-simple-member-form" variant="contained" disabled={saveMutation.isPending}>
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
        title={config.deleteDialogTitle}
        description={
          <span>
            Czy na pewno chcesz usunąć{" "}
            <strong>
              {deleteTarget?.firstName} {displayOptionalLastName(deleteTarget?.lastName)}
            </strong>
            ? Tej operacji nie cofniesz.
          </span>
        }
      />
    </>
  );
}
