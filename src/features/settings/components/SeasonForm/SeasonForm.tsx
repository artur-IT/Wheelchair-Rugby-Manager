import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { Box, Button, TextField, Typography, Paper, CircularProgress } from "@mui/material";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import AppShell from "@/components/AppShell/AppShell";
import QueryProvider from "@/components/QueryProvider/QueryProvider";
import DataLoadAlert from "@/components/ui/DataLoadAlert";
import MutationErrorAlert from "@/components/ui/MutationErrorAlert";
import { createSeason, fetchSeasonById, updateSeason, type SeasonUpsertBody } from "@/lib/api/seasons";
import { queryKeys } from "@/lib/queryKeys";
import { requiredSeasonNameSchema } from "@/lib/validateInputs";

const seasonSchema = z.object({
  name: requiredSeasonNameSchema,
  year: z.preprocess(
    (value) => (value === "" ? undefined : Number(value)),
    z.number({ message: "Rok sezonu jest wymagany" }).int().min(2000, "Podaj rok w przedziale 2000-2100").max(2100)
  ),
  description: z.string().optional(),
});

type SeasonFormValues = z.infer<typeof seasonSchema>;

interface Props {
  /** When provided, the form loads existing data and sends PATCH instead of POST */
  id?: string;
}

const redirectToSettings = () => window.location.assign("/settings");

const toSeasonUpsertBody = (data: SeasonFormValues): SeasonUpsertBody => ({
  name: data.name,
  year: data.year,
  description: data.description,
});

export default function SeasonForm({ id }: Props) {
  return (
    <QueryProvider>
      <ThemeRegistry>
        <AppShell currentPath="/settings">
          <SeasonFormContent id={id} />
        </AppShell>
      </ThemeRegistry>
    </QueryProvider>
  );
}

function SeasonFormContent({ id }: Props) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SeasonFormValues>({ resolver: zodResolver(seasonSchema as never) });

  const {
    data: seasonData,
    isPending: loading,
    isError: loadIsError,
    error: loadErrorObj,
    refetch,
  } = useQuery({
    queryKey: queryKeys.seasons.detail(id ?? "__none__"),
    queryFn: ({ signal }) => {
      if (!id) return Promise.reject(new Error("Brak id sezonu"));
      return fetchSeasonById(id, signal);
    },
    enabled: isEdit,
  });

  const loadError = loadIsError && loadErrorObj instanceof Error ? loadErrorObj.message : null;

  useEffect(() => {
    if (!seasonData) return;
    reset({
      name: seasonData.name,
      year: seasonData.year,
      description: seasonData.description ?? "",
    });
  }, [seasonData, reset]);

  const submitMutation = useMutation({
    mutationFn: (data: SeasonFormValues) =>
      isEdit && id ? updateSeason(id, toSeasonUpsertBody(data)) : createSeason(toSeasonUpsertBody(data)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.seasons.list() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      redirectToSettings();
    },
  });

  const onSubmit = (data: SeasonFormValues) => submitMutation.mutate(data);
  const isSaveDisabled = isSubmitting || submitMutation.isPending;

  if (loading && isEdit) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isEdit && loadError && !loading) {
    return (
      <Paper sx={{ p: 4, maxWidth: 480, mx: "auto", borderRadius: 3 }}>
        <DataLoadAlert message={loadError} onRetry={() => void refetch()} />
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 4, maxWidth: 480, mx: "auto", borderRadius: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: "bold", mb: 3 }}>
        {isEdit ? "Edytuj Sezon" : "Nowy Sezon"}
      </Typography>

      {submitMutation.isError ? (
        <Box sx={{ mb: 2 }}>
          <MutationErrorAlert error={submitMutation.error} fallbackMessage="Nie udało się zapisać sezonu." />
        </Box>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            label="Nazwa Sezonu"
            {...register("name")}
            error={!!errors.name}
            helperText={errors.name?.message}
          />
          <TextField
            fullWidth
            label="Rok"
            {...register("year")}
            error={!!errors.year}
            helperText={errors.year?.message}
          />
          <TextField
            fullWidth
            label="Opis"
            multiline
            rows={3}
            {...register("description")}
            error={!!errors.description}
            helperText={errors.description?.message ?? "Opcjonalnie"}
          />
        </Box>

        <Box sx={{ display: "flex", gap: 2 }}>
          <Button variant="outlined" fullWidth component="a" href="/settings">
            Anuluj
          </Button>
          <Button variant="contained" color="success" type="submit" fullWidth disabled={isSaveDisabled}>
            {isSaveDisabled ? <CircularProgress size={24} /> : "Zapisz Sezon"}
          </Button>
        </Box>
      </form>
    </Paper>
  );
}
