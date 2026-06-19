import { Grid, TextField, Typography } from "@mui/material";
import type { FieldErrors, FieldNamesMarkedBoolean, UseFormRegister, UseFormRegisterReturn } from "react-hook-form";
import type { TeamFormValues } from "@/features/teams/components/Team/TeamForm/TeamForm";
import { FIELD_REQUIRED_MESSAGE } from "@/lib/validateInputs";

interface TeamContactSectionProps {
  register: UseFormRegister<TeamFormValues>;
  errors: FieldErrors<TeamFormValues>;
  touchedFields: FieldNamesMarkedBoolean<TeamFormValues>;
  showAllErrors: boolean;
  contactPhoneField: UseFormRegisterReturn;
  requiredFieldSx: object;
}

export default function TeamContactSection({
  register,
  errors,
  touchedFields,
  showAllErrors,
  contactPhoneField,
  requiredFieldSx,
}: TeamContactSectionProps) {
  return (
    <>
      <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2 }}>
        Osoba do kontaktu
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Imię"
            {...register("contactFirstName")}
            error={Boolean((touchedFields.contactFirstName || showAllErrors) && errors.contactFirstName)}
            helperText={
              (touchedFields.contactFirstName || showAllErrors) && errors.contactFirstName
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
            {...register("contactLastName")}
            error={Boolean((touchedFields.contactLastName || showAllErrors) && errors.contactLastName)}
            helperText={
              (touchedFields.contactLastName || showAllErrors) && errors.contactLastName
                ? FIELD_REQUIRED_MESSAGE
                : undefined
            }
            sx={requiredFieldSx}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="E-mail"
            {...register("contactEmail")}
            error={Boolean((touchedFields.contactEmail || showAllErrors) && errors.contactEmail)}
            helperText={
              (touchedFields.contactEmail || showAllErrors) && errors.contactEmail ? FIELD_REQUIRED_MESSAGE : undefined
            }
            sx={requiredFieldSx}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Telefon"
            {...contactPhoneField}
            placeholder="9 cyfr"
            error={Boolean((touchedFields.contactPhone || showAllErrors) && errors.contactPhone)}
            helperText={
              (touchedFields.contactPhone || showAllErrors) && errors.contactPhone ? FIELD_REQUIRED_MESSAGE : undefined
            }
            sx={requiredFieldSx}
            slotProps={{
              htmlInput: { inputMode: "numeric" },
            }}
          />
        </Grid>
      </Grid>
    </>
  );
}
