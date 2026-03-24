import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import type { SelectChangeEvent } from "@mui/material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  DialogContentText,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { Pencil, Star, Trash2 } from "lucide-react";
import type { Season } from "@/types";
import { useDefaultSeason } from "@/components/hooks/useDefaultSeason";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import DataLoadAlert from "@/components/ui/DataLoadAlert";
import { fetchSeasonsList, deleteSeasonById } from "@/lib/api/seasons";
import { queryKeys } from "@/lib/queryKeys";

interface SeasonsManagerProps {
  onSeasonChange: (seasonId: string) => void;
}

export default function SeasonsManager({ onSeasonChange }: SeasonsManagerProps) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { defaultSeasonId, saveDefault } = useDefaultSeason();

  const {
    data: seasonsData,
    isPending: seasonsLoading,
    isError: seasonsQueryFailed,
    error: seasonsQueryError,
    refetch: refetchSeasons,
  } = useQuery({
    queryKey: queryKeys.seasons.list(),
    queryFn: ({ signal }) => fetchSeasonsList(signal),
  });

  const deleteSeasonMutation = useMutation({
    mutationFn: deleteSeasonById,
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<Season[]>(queryKeys.seasons.list(), (old) =>
        (old ?? []).filter((season) => season.id !== deletedId)
      );
      setSelectedId((prev) => {
        if (prev !== deletedId) return prev;
        const remaining = queryClient.getQueryData<Season[]>(queryKeys.seasons.list()) ?? [];
        return remaining[0]?.id ?? "";
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });

  const seasons = useMemo(() => seasonsData ?? [], [seasonsData]);
  const loadError = seasonsQueryFailed && seasonsQueryError instanceof Error ? seasonsQueryError.message : null;

  useEffect(() => {
    if (seasons.length === 0) {
      setSelectedId("");
      return;
    }
    const savedExists = Boolean(defaultSeasonId && seasons.some((season) => season.id === defaultSeasonId));
    setSelectedId(savedExists ? (defaultSeasonId ?? "") : seasons[0].id);
  }, [defaultSeasonId, seasons]);

  useEffect(() => {
    if (!selectedId) return;
    onSeasonChange(selectedId);
  }, [onSeasonChange, selectedId]);

  const handleDeleteConfirm = () => {
    setConfirmOpen(false);
    deleteSeasonMutation.mutate(selectedId);
  };

  const selectedSeason = seasons.find((season) => season.id === selectedId);

  if (seasonsLoading) return <CircularProgress size={20} sx={{ mb: 3 }} />;

  if (loadError && seasons.length === 0) {
    return <DataLoadAlert message={loadError} onRetry={() => void refetchSeasons()} sx={{ mb: 3 }} />;
  }

  if (seasons.length === 0) {
    return (
      <Alert
        severity="warning"
        sx={{ mb: 3 }}
        action={
          <Button color="inherit" size="small" component="a" href="/settings/seasons/new">
            Utwórz sezon
          </Button>
        }
      >
        Brak sezonu — dodaj drużyny dopiero po utworzeniu sezonu.
      </Alert>
    );
  }

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <FormControl size="small" sx={{ minWidth: 240 }}>
          <InputLabel>Sezon</InputLabel>
          <Select
            label="Sezon"
            value={selectedId}
            onChange={(event: SelectChangeEvent) => setSelectedId(event.target.value)}
          >
            {seasons.map((season) => (
              <MenuItem key={season.id} value={season.id}>
                {season.name}
                {season.year ? ` (${season.year})` : ""}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <IconButton
          onClick={() => saveDefault(selectedId)}
          disabled={!selectedId}
          title="Ustaw jako domyślny sezon"
          color={selectedId === defaultSeasonId ? "warning" : "default"}
        >
          <Star size={18} fill={selectedId === defaultSeasonId ? "currentColor" : "none"} />
        </IconButton>

        <IconButton
          component="a"
          href={`/settings/seasons/${selectedId}/edit`}
          disabled={!selectedId}
          title="Edytuj sezon"
        >
          <Pencil size={18} />
        </IconButton>

        <IconButton
          color="error"
          onClick={() => setConfirmOpen(true)}
          disabled={deleteSeasonMutation.isPending || !selectedId}
          title="Usuń sezon"
        >
          {deleteSeasonMutation.isPending ? <CircularProgress size={20} /> : <Trash2 size={18} />}
        </IconButton>

        <Button variant="outlined" size="small" component="a" href="/settings/seasons/new">
          + Nowy sezon
        </Button>

        {deleteSeasonMutation.isError && deleteSeasonMutation.error instanceof Error ? (
          <Alert severity="error" sx={{ py: 0 }}>
            {deleteSeasonMutation.error.message}
          </Alert>
        ) : null}
      </Box>

      <ConfirmationDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        loading={deleteSeasonMutation.isPending}
        title="Usuń sezon"
        description={
          <DialogContentText>
            Czy na pewno chcesz usunąć sezon <strong>{selectedSeason?.name}</strong>? Tej operacji nie można cofnąć.
          </DialogContentText>
        }
      />
    </>
  );
}
