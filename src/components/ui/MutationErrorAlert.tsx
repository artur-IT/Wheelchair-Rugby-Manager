import { Alert } from "@mui/material";

interface MutationErrorAlertProps {
  error: unknown;
  fallbackMessage?: string;
}

export default function MutationErrorAlert({
  error,
  fallbackMessage = "Wystąpił błąd podczas zapisywania zmian.",
}: MutationErrorAlertProps) {
  if (!error) return null;
  const message = error instanceof Error ? error.message : fallbackMessage;
  return <Alert severity="error">{message}</Alert>;
}
