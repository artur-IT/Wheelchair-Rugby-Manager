import { Grid, TextField, Typography } from "@mui/material";
import type { FieldErrors, FieldNamesMarkedBoolean, UseFormRegister, UseFormRegisterReturn } from "react-hook-form";
import type { TeamFormValues } from "@/features/teams/components/Team/TeamForm/TeamForm";

interface TeamContactSectionProps {
  register: UseFormRegister<TeamFormValues>;
  errors: FieldErrors<TeamFormValues>;
  touchedFields: FieldNamesMarkedBoolean<TeamFormValues>;
  contactPhoneField: UseFormRegisterReturn;
  requiredFieldSx: object;
}

export default function TeamContactSection({
  register,
  errors,
  touchedFields,
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
            error={Boolean(touchedFields.contactFirstName && errors.contactFirstName)}
            helperText={touchedFields.contactFirstName ? errors.contactFirstName?.message : undefined}
            sx={requiredFieldSx}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Nazwisko"
            {...register("contactLastName")}
            error={Boolean(touchedFields.contactLastName && errors.contactLastName)}
            helperText={touchedFields.contactLastName ? errors.contactLastName?.message : undefined}
            sx={requiredFieldSx}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="E-mail"
            {...register("contactEmail")}
            error={Boolean(touchedFields.contactEmail && errors.contactEmail)}
            helperText={touchedFields.contactEmail ? errors.contactEmail?.message : undefined}
            sx={requiredFieldSx}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Telefon"
            {...contactPhoneField}
            placeholder="9 cyfr"
            inputProps={{ inputMode: "numeric" }}
            error={Boolean(touchedFields.contactPhone && errors.contactPhone)}
            helperText={touchedFields.contactPhone ? errors.contactPhone?.message : undefined}
            sx={requiredFieldSx}
          />
        </Grid>
      </Grid>
    </>
  );
}
