import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { Box, Button, TextField, Typography, Paper, Alert, CircularProgress } from "@mui/material";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import AppShell from "@/components/AppShell/AppShell";
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

export default function SeasonForm({ id }: Props) {
  return (
    <ThemeRegistry>
      <AppShell currentPath="/settings">
        <SeasonFormContent id={id} />
      </AppShell>
    </ThemeRegistry>
  );
}

function SeasonFormContent({ id }: Props) {
  const isEdit = !!id;
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEdit);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    // Zod 4.3 types incompatible with @hookform/resolvers — runtime works correctly
  } = useForm<SeasonFormValues>({ resolver: zodResolver(seasonSchema as never) });

  // In edit mode: fetch existing season and pre-fill the form
  useEffect(() => {
    if (!isEdit) return;
    fetch(`/api/seasons/${id}`)
      .then((r) => r.json())
      .then((data: SeasonFormValues) => reset(data))
      .catch(() => setSubmitError("Nie udało się pobrać danych sezonu"))
      .finally(() => setLoading(false));
  }, [id, isEdit, reset]);

  const onSubmit = async (data: SeasonFormValues) => {
    setSubmitError(null);
    try {
      const url = isEdit ? `/api/seasons/${id}` : "/api/seasons";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error?.formErrors?.[0] ?? "Nie udało się zapisać sezonu");
      }

      window.location.href = "/settings";
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 4, maxWidth: 480, mx: "auto", borderRadius: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: "bold", mb: 3 }}>
        {isEdit ? "Edytuj Sezon" : "Nowy Sezon"}
      </Typography>

      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {submitError}
        </Alert>
      )}

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
            type="number"
            required
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
          <Button variant="contained" color="success" type="submit" fullWidth disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} /> : "Zapisz Sezon"}
          </Button>
        </Box>
      </form>
    </Paper>
  );
}
