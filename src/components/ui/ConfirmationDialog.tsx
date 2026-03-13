import { ReactNode } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  type Breakpoint,
} from "@mui/material";

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  confirmDisabled?: boolean;
  errorMessage?: string | null;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: "primary" | "secondary" | "error" | "info" | "success" | "warning" | "inherit";
  confirmVariant?: "text" | "outlined" | "contained";
  maxWidth?: Breakpoint;
  fullWidth?: boolean;
}

// Reusable dialog that keeps delete confirmations consistent across the UI.
export default function ConfirmationDialog({
  open,
  title,
  description,
  children,
  onClose,
  onConfirm,
  loading,
  confirmDisabled,
  errorMessage,
  confirmLabel = "Usuń",
  cancelLabel = "Anuluj",
  confirmColor = "error",
  confirmVariant = "contained",
  maxWidth = "xs",
  fullWidth = true,
}: ConfirmationDialogProps) {
  const shouldWrapDescription =
    description != null && (typeof description === "string" || typeof description === "number");

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth={maxWidth} fullWidth={fullWidth}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}
        {description != null && shouldWrapDescription && <DialogContentText>{description}</DialogContentText>}
        {description != null && !shouldWrapDescription && description}
        {children}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={Boolean(loading)}>
          {cancelLabel}
        </Button>
        <Button
          color={confirmColor}
          variant={confirmVariant}
          onClick={onConfirm}
          disabled={Boolean(loading) || confirmDisabled}
        >
          {loading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} aria-label="Ładowanie..." />
              {confirmLabel}
            </>
          ) : (
            confirmLabel
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
