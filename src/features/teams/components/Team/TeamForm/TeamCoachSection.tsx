import { Grid, TextField, Typography } from "@mui/material";
import type { FieldErrors, FieldNamesMarkedBoolean, UseFormRegister, UseFormRegisterReturn } from "react-hook-form";
import type { TeamFormValues } from "@/features/teams/components/Team/TeamForm/TeamForm";

interface TeamCoachSectionProps {
  register: UseFormRegister<TeamFormValues>;
  errors: FieldErrors<TeamFormValues>;
  touchedFields: FieldNamesMarkedBoolean<TeamFormValues>;
  coachPhoneField: UseFormRegisterReturn;
  requiredFieldSx: object;
}

export default function TeamCoachSection({
  register,
  errors,
  touchedFields,
  coachPhoneField,
  requiredFieldSx,
}: TeamCoachSectionProps) {
  return (
    <>
      <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2 }}>
        Trener
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Imię"
            {...register("coachFirstName")}
            error={Boolean(touchedFields.coachFirstName && errors.coachFirstName)}
            helperText={touchedFields.coachFirstName ? errors.coachFirstName?.message : undefined}
            sx={requiredFieldSx}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Nazwisko"
            {...register("coachLastName")}
            error={Boolean(touchedFields.coachLastName && errors.coachLastName)}
            helperText={touchedFields.coachLastName ? errors.coachLastName?.message : undefined}
            sx={requiredFieldSx}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="E-mail"
            {...register("coachEmail")}
            error={Boolean(touchedFields.coachEmail && errors.coachEmail)}
            helperText={touchedFields.coachEmail ? errors.coachEmail?.message : undefined}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Telefon"
            {...coachPhoneField}
            placeholder="9 cyfr"
            inputProps={{ inputMode: "numeric" }}
            error={Boolean(touchedFields.coachPhone && errors.coachPhone)}
            helperText={touchedFields.coachPhone ? errors.coachPhone?.message : undefined}
          />
        </Grid>
      </Grid>
    </>
  );
}
