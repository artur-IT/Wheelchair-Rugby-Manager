import { Grid, TextField, Typography } from "@mui/material";
import type { FieldErrors, FieldNamesMarkedBoolean, UseFormRegister, UseFormRegisterReturn } from "react-hook-form";
import type { TeamFormValues } from "@/features/teams/components/Team/TeamForm/TeamForm";

interface TeamRefereeSectionProps {
  register: UseFormRegister<TeamFormValues>;
  errors: FieldErrors<TeamFormValues>;
  touchedFields: FieldNamesMarkedBoolean<TeamFormValues>;
  refereePhoneField: UseFormRegisterReturn;
}

export default function TeamRefereeSection({
  register,
  errors,
  touchedFields,
  refereePhoneField,
}: TeamRefereeSectionProps) {
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
            error={Boolean(touchedFields.refereeFirstName && errors.refereeFirstName)}
            helperText={touchedFields.refereeFirstName ? errors.refereeFirstName?.message : undefined}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Nazwisko"
            {...register("refereeLastName")}
            error={Boolean(touchedFields.refereeLastName && errors.refereeLastName)}
            helperText={touchedFields.refereeLastName ? errors.refereeLastName?.message : undefined}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="E-mail (opcjonalnie)"
            {...register("refereeEmail")}
            error={Boolean(touchedFields.refereeEmail && errors.refereeEmail)}
            helperText={touchedFields.refereeEmail ? errors.refereeEmail?.message : undefined}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Telefon"
            {...refereePhoneField}
            placeholder="9 cyfr"
            inputProps={{ inputMode: "numeric" }}
            error={Boolean(touchedFields.refereePhone && errors.refereePhone)}
            helperText={touchedFields.refereePhone ? errors.refereePhone?.message : undefined}
          />
        </Grid>
      </Grid>
    </>
  );
}
