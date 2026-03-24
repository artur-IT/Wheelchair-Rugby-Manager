import { Grid, TextField, Typography } from "@mui/material";
import type { FieldErrors, UseFormRegister, UseFormRegisterReturn } from "react-hook-form";
import type { TeamFormValues } from "@/features/teams/components/Team/TeamForm/TeamForm";

interface TeamCoachSectionProps {
  register: UseFormRegister<TeamFormValues>;
  errors: FieldErrors<TeamFormValues>;
  coachPhoneField: UseFormRegisterReturn;
  requiredFieldSx: object;
}

export default function TeamCoachSection({
  register,
  errors,
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
            error={!!errors.coachFirstName}
            helperText={errors.coachFirstName?.message}
            sx={requiredFieldSx}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Nazwisko"
            {...register("coachLastName")}
            error={!!errors.coachLastName}
            helperText={errors.coachLastName?.message}
            sx={requiredFieldSx}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Email"
            {...register("coachEmail")}
            error={!!errors.coachEmail}
            helperText={errors.coachEmail?.message}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Telefon"
            {...coachPhoneField}
            placeholder="9 cyfr"
            inputProps={{ inputMode: "numeric" }}
            error={!!errors.coachPhone}
            helperText={errors.coachPhone?.message}
          />
        </Grid>
      </Grid>
    </>
  );
}
