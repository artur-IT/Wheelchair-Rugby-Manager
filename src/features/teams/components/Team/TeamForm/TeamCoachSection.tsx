import { Grid, TextField, Typography } from "@mui/material";
import type { FieldErrors, FieldNamesMarkedBoolean, UseFormRegister, UseFormRegisterReturn } from "react-hook-form";
import type { TeamFormValues } from "@/features/teams/components/Team/TeamForm/TeamForm";
import { FIELD_REQUIRED_MESSAGE } from "@/lib/validateInputs";

interface TeamCoachSectionProps {
  register: UseFormRegister<TeamFormValues>;
  errors: FieldErrors<TeamFormValues>;
  touchedFields: FieldNamesMarkedBoolean<TeamFormValues>;
  showAllErrors: boolean;
  coachPhoneField: UseFormRegisterReturn;
  requiredFieldSx: object;
}

export default function TeamCoachSection({
  register,
  errors,
  touchedFields,
  showAllErrors,
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
            error={Boolean((touchedFields.coachFirstName || showAllErrors) && errors.coachFirstName)}
            helperText={
              (touchedFields.coachFirstName || showAllErrors) && errors.coachFirstName
                ? FIELD_REQUIRED_MESSAGE
                : undefined
            }
            sx={requiredFieldSx}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Nazwisko"
            {...register("coachLastName")}
            error={Boolean((touchedFields.coachLastName || showAllErrors) && errors.coachLastName)}
            helperText={
              (touchedFields.coachLastName || showAllErrors) && errors.coachLastName ? FIELD_REQUIRED_MESSAGE : undefined
            }
            sx={requiredFieldSx}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="E-mail"
            {...register("coachEmail")}
            error={Boolean((touchedFields.coachEmail || showAllErrors) && errors.coachEmail)}
            helperText={
              (touchedFields.coachEmail || showAllErrors) && errors.coachEmail ? FIELD_REQUIRED_MESSAGE : undefined
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Telefon"
            {...coachPhoneField}
            placeholder="9 cyfr"
            error={Boolean((touchedFields.coachPhone || showAllErrors) && errors.coachPhone)}
            helperText={
              (touchedFields.coachPhone || showAllErrors) && errors.coachPhone ? FIELD_REQUIRED_MESSAGE : undefined
            }
            slotProps={{
              htmlInput: { inputMode: "numeric" },
            }}
            sx={requiredFieldSx}
          />
        </Grid>
      </Grid>
    </>
  );
}
