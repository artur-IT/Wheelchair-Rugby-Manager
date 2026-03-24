import type { ReactNode } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";

export interface SelectionDialogItem {
  id: string;
  label: string;
}

interface SelectionDialogProps {
  open: boolean;
  title: string;
  items: SelectionDialogItem[];
  selectedIds: string[];
  toggleSelected: (id: string) => void;
  onClose: () => void;
  onSave: () => void;
  loading?: boolean;
  availableLoading?: boolean;
  availableError?: string;
  saveError?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  emptyState?: ReactNode;
  description?: ReactNode;
}

export default function SelectionDialog({
  open,
  title,
  items,
  selectedIds,
  toggleSelected,
  onClose,
  onSave,
  loading = false,
  availableLoading = false,
  availableError,
  saveError,
  confirmLabel = "Dodaj",
  cancelLabel = "Anuluj",
  emptyState,
  description,
}: SelectionDialogProps) {
  const showEmptyState = !items.length && !availableLoading;

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        {description}
        {availableError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {availableError}
          </Alert>
        ) : null}
        {saveError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {saveError}
          </Alert>
        ) : null}

        {availableLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <List dense>
            {items.map((item) => {
              const checked = selectedIds.includes(item.id);
              return (
                <ListItemButton key={item.id} onClick={() => toggleSelected(item.id)}>
                  <ListItemIcon>
                    <Checkbox edge="start" checked={checked} tabIndex={-1} disableRipple />
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              );
            })}
            {showEmptyState
              ? (emptyState ?? (
                  <Typography color="textSecondary" sx={{ py: 1 }}>
                    Brak pozycji do wyboru.
                  </Typography>
                ))
              : null}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant="contained" onClick={onSave} disabled={loading || availableLoading}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
