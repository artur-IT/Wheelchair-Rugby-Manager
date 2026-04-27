import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
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
import { MAX_SHORT_TEXT, sanitizePhone } from "@/lib/validateInputs";
import type { PersonFormFields, PersonFormPayload } from "@/features/settings/components/SettingsPage/types";

const personDialogInitialState: PersonFormFields = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
};

interface AddPersonDialogProps {
  open: boolean;
  loading: boolean;
  error: string | null;
  dialogTitle: string;
  submitLabel?: string;
  initialValues?: PersonFormFields;
  onClose: () => void;
  onSubmit: (payload: PersonFormPayload) => void;
}

export default function AddPersonDialog({
  open,
  loading,
  error,
  dialogTitle,
  submitLabel,
  initialValues,
  onClose,
  onSubmit,
}: AddPersonDialogProps) {
  const [form, setForm] = useState<PersonFormFields>(personDialogInitialState);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(initialValues ?? personDialogInitialState);
    setLocalError(null);
  }, [initialValues, open]);

  const handleFieldChange = (field: keyof PersonFormFields) => (event: ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    setForm((current) => ({ ...current, [field]: rawValue }));
  };

  const handlePhoneChange = (event: ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, phone: sanitizePhone(event.target.value) }));

  const handleSave = () => {
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    if (!firstName || !lastName) {
      setLocalError("Imię i nazwisko są wymagane");
      return;
    }
    if (firstName.length > MAX_SHORT_TEXT || lastName.length > MAX_SHORT_TEXT) {
      setLocalError(`Imię i nazwisko nie mogą przekraczać ${MAX_SHORT_TEXT} znaków`);
      return;
    }
    const email = form.email.trim();
    if (email && email.length > MAX_SHORT_TEXT) {
      setLocalError(`E-mail nie może przekraczać ${MAX_SHORT_TEXT} znaków`);
      return;
    }
    const phone = form.phone.trim();
    if (phone.length !== 9) {
      setLocalError("Telefon jest wymagany i musi zawierać dokładnie 9 cyfr");
      return;
    }

    setLocalError(null);
    onSubmit({
      firstName,
      lastName,
      email: email || null,
      phone,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          {localError && <Alert severity="error">{localError}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Imię" value={form.firstName} onChange={handleFieldChange("firstName")} />
          <TextField label="Nazwisko" value={form.lastName} onChange={handleFieldChange("lastName")} />
          <TextField label="E-mail" type="email" value={form.email} onChange={handleFieldChange("email")} />
          <TextField
            label="Telefon"
            placeholder="9 cyfr"
            inputMode="numeric"
            value={form.phone}
            onChange={handlePhoneChange}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Anuluj
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}>
          {loading ? <CircularProgress size={18} /> : (submitLabel ?? "Zapisz")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
