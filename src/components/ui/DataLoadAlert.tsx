import { Alert, Button } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

interface DataLoadAlertProps {
  message: string | null;
  severity?: "error" | "warning" | "info";
  onRetry?: () => void;
  /** Shown next to the message when onRetry is set */
  retryLabel?: string;
  sx?: SxProps<Theme>;
}

/** Consistent load/partial-load/API error banner with optional retry. */
export default function DataLoadAlert({
  message,
  severity = "error",
  onRetry,
  retryLabel = "Spróbuj ponownie",
  sx,
}: DataLoadAlertProps) {
  if (!message) return null;
  return (
    <Alert
      severity={severity}
      sx={sx}
      action={
        onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : undefined
      }
    >
      {message}
    </Alert>
  );
}
