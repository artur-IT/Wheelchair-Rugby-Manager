import { Grid, TextField, Typography } from "@mui/material";
import type { FieldErrors, UseFormRegister, UseFormRegisterReturn } from "react-hook-form";
import type { TeamFormValues } from "@/features/teams/components/Team/TeamForm/TeamForm";

interface TeamContactSectionProps {
  register: UseFormRegister<TeamFormValues>;
  errors: FieldErrors<TeamFormValues>;
  contactPhoneField: UseFormRegisterReturn;
  requiredFieldSx: object;
}

export default function TeamContactSection({
  register,
  errors,
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
            error={!!errors.contactFirstName}
            helperText={errors.contactFirstName?.message}
            sx={requiredFieldSx}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Nazwisko"
            {...register("contactLastName")}
            error={!!errors.contactLastName}
            helperText={errors.contactLastName?.message}
            sx={requiredFieldSx}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Email"
            {...register("contactEmail")}
            error={!!errors.contactEmail}
            helperText={errors.contactEmail?.message}
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
            error={!!errors.contactPhone}
            helperText={errors.contactPhone?.message}
            sx={requiredFieldSx}
          />
        </Grid>
      </Grid>
    </>
  );
}
