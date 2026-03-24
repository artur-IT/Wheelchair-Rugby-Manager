import { Grid, TextField, Typography } from "@mui/material";
import type { FieldErrors, UseFormRegister, UseFormRegisterReturn } from "react-hook-form";
import type { TeamFormValues } from "@/features/teams/components/Team/TeamForm/TeamForm";

interface TeamRefereeSectionProps {
  register: UseFormRegister<TeamFormValues>;
  errors: FieldErrors<TeamFormValues>;
  refereePhoneField: UseFormRegisterReturn;
}

export default function TeamRefereeSection({ register, errors, refereePhoneField }: TeamRefereeSectionProps) {
  return (
    <>
      <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2 }}>
        Sędzia
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Imię"
            {...register("refereeFirstName")}
            error={!!errors.refereeFirstName}
            helperText={errors.refereeFirstName?.message}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Nazwisko"
            {...register("refereeLastName")}
            error={!!errors.refereeLastName}
            helperText={errors.refereeLastName?.message}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Email (opcjonalnie)"
            {...register("refereeEmail")}
            error={!!errors.refereeEmail}
            helperText={errors.refereeEmail?.message}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Telefon (opcjonalnie)"
            {...refereePhoneField}
            placeholder="9 cyfr"
            inputProps={{ inputMode: "numeric" }}
            error={!!errors.refereePhone}
            helperText={errors.refereePhone?.message}
          />
        </Grid>
      </Grid>
    </>
  );
}
