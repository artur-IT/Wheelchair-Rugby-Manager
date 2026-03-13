import type { Dispatch, SetStateAction } from "react";
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

export interface PlayerRow {
  id: string;
  firstName: string;
  lastName: string;
  classification: number;
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
  return (
    <Dialog open={open} onClose={playerActionLoading ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Dodaj zawodnika</DialogTitle>
      <DialogContent>
        {playerActionError && (
          <Alert severity="error" sx={{ mt: 1, mb: 1 }}>
            {playerActionError}
          </Alert>
        )}
        {newPlayerForm && (
          <>
            {/* Inputs for the new player's details */}
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Imię"
                  value={newPlayerForm.firstName}
                  onChange={(e) => setNewPlayerForm((form) => (form ? { ...form, firstName: e.target.value } : form))}
                  required
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Nazwisko"
                  value={newPlayerForm.lastName}
                  onChange={(e) => setNewPlayerForm((form) => (form ? { ...form, lastName: e.target.value } : form))}
                  required
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Klasyfikacja"
                  type="number"
                  inputProps={{ step: 0.5, min: 0.5, max: 4.0, inputMode: "decimal" }}
                  value={newPlayerForm.classification}
                  onChange={(e) =>
                    setNewPlayerForm((form) => (form ? { ...form, classification: parseFloat(e.target.value) } : form))
                  }
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Numer"
                  type="number"
                  inputProps={{ min: 1, max: 99, inputMode: "numeric" }}
                  value={newPlayerForm.number}
                  onChange={(e) =>
                    setNewPlayerForm((form) => (form ? { ...form, number: Number(e.target.value) } : form))
                  }
                  fullWidth
                  size="small"
                />
              </Grid>
            </Grid>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={playerActionLoading}>
          Anuluj
        </Button>
        <Button variant="contained" onClick={onSave} disabled={playerActionLoading || !newPlayerForm}>
          {playerActionLoading ? <CircularProgress size={24} /> : "Dodaj zawodnika"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
