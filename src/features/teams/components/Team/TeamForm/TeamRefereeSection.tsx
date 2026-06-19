import { Grid, TextField, Typography } from "@mui/material";
import type { FieldErrors, FieldNamesMarkedBoolean, UseFormRegister, UseFormRegisterReturn } from "react-hook-form";
import type { TeamFormValues } from "@/features/teams/components/Team/TeamForm/TeamForm";
import { FIELD_REQUIRED_MESSAGE } from "@/lib/validateInputs";

interface TeamRefereeSectionProps {
  register: UseFormRegister<TeamFormValues>;
  errors: FieldErrors<TeamFormValues>;
  touchedFields: FieldNamesMarkedBoolean<TeamFormValues>;
  showAllErrors: boolean;
  refereePhoneField: UseFormRegisterReturn;
}

export default function TeamRefereeSection({
  register,
  errors,
  touchedFields,
  showAllErrors,
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
            error={Boolean((touchedFields.refereeFirstName || showAllErrors) && errors.refereeFirstName)}
            helperText={
              (touchedFields.refereeFirstName || showAllErrors) && errors.refereeFirstName
                ? FIELD_REQUIRED_MESSAGE
                : undefined
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Nazwisko"
            {...register("refereeLastName")}
            error={Boolean((touchedFields.refereeLastName || showAllErrors) && errors.refereeLastName)}
            helperText={
              (touchedFields.refereeLastName || showAllErrors) && errors.refereeLastName
                ? FIELD_REQUIRED_MESSAGE
                : undefined
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="E-mail (opcjonalnie)"
            {...register("refereeEmail")}
            error={Boolean((touchedFields.refereeEmail || showAllErrors) && errors.refereeEmail)}
            helperText={
              (touchedFields.refereeEmail || showAllErrors) && errors.refereeEmail ? FIELD_REQUIRED_MESSAGE : undefined
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Telefon"
            {...refereePhoneField}
            placeholder="9 cyfr"
            error={Boolean((touchedFields.refereePhone || showAllErrors) && errors.refereePhone)}
            helperText={
              (touchedFields.refereePhone || showAllErrors) && errors.refereePhone ? FIELD_REQUIRED_MESSAGE : undefined
            }
            slotProps={{
              htmlInput: { inputMode: "numeric" },
            }}
          />
        </Grid>
      </Grid>
    </>
  );
}
