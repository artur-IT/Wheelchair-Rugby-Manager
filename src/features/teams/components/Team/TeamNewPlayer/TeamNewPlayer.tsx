import { useState, type Dispatch, type SetStateAction } from "react";
import { z } from "@/lib/zodPl";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
} from "@mui/material";
import {
  requiredFirstNameSchema,
  requiredLastNameSchema,
  playerClassificationSchema,
  playerNumberSchema,
} from "@/lib/validateInputs";
import { parseOptionalNumber } from "@/features/teams/components/Team/shared/teamFormUtils";

const playerSchema = z.object({
  firstName: requiredFirstNameSchema,
  lastName: requiredLastNameSchema,
  classification: z.preprocess((v) => (v === null ? undefined : v), playerClassificationSchema.optional()),
  number: playerNumberSchema,
});

type PlayerErrors = Partial<Record<"firstName" | "lastName" | "classification" | "number", string>>;

export interface PlayerRow {
  id: string;
  firstName: string;
  lastName: string;
  classification?: number | null;
  number: number;
}

interface TeamNewPlayerProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  playerActionError: string | null;
  playerActionLoading: boolean;
  newPlayerForm: PlayerRow | null;
  setNewPlayerForm: Dispatch<SetStateAction<PlayerRow | null>>;
}

export default function TeamNewPlayer({
  open,
  onClose,
  onSave,
  playerActionError,
  playerActionLoading,
  newPlayerForm,
  setNewPlayerForm,
}: TeamNewPlayerProps) {
  const [formErrors, setFormErrors] = useState<PlayerErrors>({});

  const handleSave = () => {
    if (!newPlayerForm) return;
    const result = playerSchema.safeParse(newPlayerForm);
    if (!result.success) {
      const errors: PlayerErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof PlayerErrors;
        if (!errors[field]) errors[field] = issue.message;
      }
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    onSave();
  };

  const handleClose = () => {
    setFormErrors({});
    onClose();
  };

  const clearFieldError = (field: keyof PlayerErrors) => {
    if (!formErrors[field]) return;
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <Dialog open={open} onClose={playerActionLoading ? undefined : handleClose} maxWidth="xs" fullWidth disableRestoreFocus>
      <DialogTitle>Dodaj zawodnika</DialogTitle>
      <DialogContent>
        {playerActionError && (
          <Alert severity="error" sx={{ mt: 1, mb: 1 }}>
            {playerActionError}
          </Alert>
        )}
        {newPlayerForm && (
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Imię"
                value={newPlayerForm.firstName}
                onChange={(e) => {
                  setNewPlayerForm((form) => (form ? { ...form, firstName: e.target.value } : form));
                  clearFieldError("firstName");
                }}
                fullWidth
                size="small"
                error={!!formErrors.firstName}
                helperText={formErrors.firstName}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Nazwisko"
                value={newPlayerForm.lastName}
                onChange={(e) => {
                  setNewPlayerForm((form) => (form ? { ...form, lastName: e.target.value } : form));
                  clearFieldError("lastName");
                }}
                fullWidth
                size="small"
                error={!!formErrors.lastName}
                helperText={formErrors.lastName}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Klasyfikacja"
                type="number"
                inputProps={{ inputMode: "decimal" }}
                value={newPlayerForm.classification ?? ""}
                onChange={(e) => {
                  const numericValue = parseOptionalNumber(e.target.value) ?? null;
                  setNewPlayerForm((form) => (form ? { ...form, classification: numericValue } : form));
                  clearFieldError("classification");
                }}
                fullWidth
                size="small"
                error={!!formErrors.classification}
                helperText={formErrors.classification}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Numer"
                type="number"
                inputProps={{ inputMode: "numeric" }}
                value={newPlayerForm.number}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewPlayerForm((form) => (form ? { ...form, number: val === "" ? 0 : Number(val) } : form));
                  clearFieldError("number");
                }}
                fullWidth
                size="small"
                error={!!formErrors.number}
                helperText={formErrors.number}
              />
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={playerActionLoading}>
          Anuluj
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={playerActionLoading || !newPlayerForm}>
          {playerActionLoading ? <CircularProgress size={24} /> : "Dodaj zawodnika"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
