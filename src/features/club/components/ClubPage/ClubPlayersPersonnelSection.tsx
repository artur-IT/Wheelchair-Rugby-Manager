import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import ClubPlayerForm from "@/features/club/components/ClubPage/ClubPlayerForm";
import ClubPlayersList from "@/features/club/components/ClubPage/ClubPlayersList";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import DataLoadAlert from "@/components/ui/DataLoadAlert";
import MutationErrorAlert from "@/components/ui/MutationErrorAlert";
import type { ClubPlayerFormValues } from "@/features/club/lib/clubPersonnelFormSchemas";
import { clubPlayerFormSchema } from "@/features/club/lib/clubPersonnelFormSchemas";
import {
  ClubPersonnelValidationError,
  extractClubApiErrorMessage,
  parseClubPlayerApiFieldMessages,
  playerNumberToFormValue,
  zodSafeParseResolver,
} from "@/features/club/lib/clubPersonnelHelpers";
import type { ClubPlayerDto } from "@/features/club/components/ClubPage/types";
import { blurActiveElement } from "@/lib/a11y/blurActiveElement";
import { CLUB_PLAYER_CLASSIFICATION_VALUES } from "@/lib/clubSchemas";

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

  const handlePlayerFormSubmit = useCallback(
    (values: ClubPlayerFormValues) => {
      saveMutation.mutate(values);
    },
    [saveMutation]
  );

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

      <ClubPlayersList
        players={players}
        isDeletePending={deleteMutation.isPending}
        deleteTargetId={deleteTarget?.id ?? null}
        onEditPlayer={(p) => {
          setEditing(p);
          setDialogOpen(true);
        }}
        onDeletePlayer={setDeleteTarget}
      />

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
          {dialogOpen ? (
            <ClubPlayerForm form={form} saveError={saveMutation.error} onSubmit={handlePlayerFormSubmit} />
          ) : null}
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
