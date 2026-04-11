import { Box, Button, Card, CardContent, CircularProgress, Stack, TextField, Typography } from "@mui/material";

import type { ClubDto } from "./types";

interface ClubHeaderCardProps {
  isLoading: boolean;
  errorMessage: string | null;
  selectedClub: ClubDto | null;
  showClubForm: boolean;
  isEditMode: boolean;
  clubName: string;
  clubLogoPreviewUrl: string;
  logoErrorMessage: string | null;
  isCreatePending: boolean;
  createErrorMessage: string | null;
  onShowClubForm: () => void;
  onShowClubEditForm: () => void;
  onCancelClubForm: () => void;
  onClubNameChange: (value: string) => void;
  onClubLogoFileChange: (file: File | null) => void;
  onSaveClub: () => void;
}

export default function ClubHeaderCard({
  isLoading,
  errorMessage,
  selectedClub,
  showClubForm,
  isEditMode,
  clubName,
  clubLogoPreviewUrl,
  logoErrorMessage,
  isCreatePending,
  createErrorMessage,
  onShowClubForm,
  onShowClubEditForm,
  onCancelClubForm,
  onClubNameChange,
  onClubLogoFileChange,
  onSaveClub,
}: ClubHeaderCardProps) {
  return (
    <Card>
      <CardContent>
        {isLoading ? <CircularProgress size={22} /> : null}
        {errorMessage ? <Typography color="error.main">{errorMessage}</Typography> : null}

        {!isLoading && selectedClub && !showClubForm ? (
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "center", md: "center" }}
            gap={{ xs: 1.5, md: 1 }}
            sx={{ mt: 2 }}
          >
            <Stack
              direction="row"
              alignItems="center"
              gap={1}
              sx={{
                alignSelf: { xs: "stretch", md: "auto" },
                flex: { md: 1 },
                minWidth: 0,
                width: { xs: "100%", md: "auto" },
              }}
            >
              {selectedClub.logoUrl ? (
                <Box
                  component="img"
                  src={selectedClub.logoUrl}
                  alt={`Logo klubu ${selectedClub.name}`}
                  sx={{ width: "4em", height: "4em", objectFit: "contain", flexShrink: 0 }}
                />
              ) : null}
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {selectedClub.name}
              </Typography>
            </Stack>

            <Button
              variant="outlined"
              onClick={onShowClubEditForm}
              sx={{ alignSelf: { xs: "center", md: "auto" }, flexShrink: 0 }}
            >
              Edytuj
            </Button>
          </Stack>
        ) : null}

        {!isLoading && (!selectedClub || showClubForm) ? (
          <Stack gap={1.5} sx={{ mt: 2 }}>
            {!selectedClub && !showClubForm ? (
              <Button variant="contained" onClick={onShowClubForm}>
                Dodaj klub
              </Button>
            ) : (
              <Stack gap={2}>
                <TextField
                  label="Nazwa klubu"
                  value={clubName}
                  onChange={(e) => onClubNameChange(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Logo klubu"
                  value=""
                  type="file"
                  inputProps={{ accept: "image/png,image/jpeg,image/webp" }}
                  onChange={(e) => {
                    const input = e.target as HTMLInputElement;
                    onClubLogoFileChange(input.files?.[0] ?? null);
                  }}
                  error={Boolean(logoErrorMessage)}
                  helperText={logoErrorMessage ?? "Dozwolone: PNG, JPG, WEBP. Maks. 2MB."}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                {clubLogoPreviewUrl ? (
                  <Box
                    component="img"
                    src={clubLogoPreviewUrl}
                    alt="Podgląd logo klubu"
                    sx={{ width: "6em", height: "6em", objectFit: "contain" }}
                  />
                ) : null}
                <Stack direction={{ xs: "column", md: "row" }} gap={2}>
                  <Button
                    variant="contained"
                    disabled={!clubName.trim() || isCreatePending || Boolean(logoErrorMessage)}
                    onClick={onSaveClub}
                  >
                    {isEditMode ? "Zapisz zmiany" : "Zapisz klub"}
                  </Button>
                  <Button variant="outlined" disabled={isCreatePending} onClick={onCancelClubForm}>
                    Anuluj
                  </Button>
                </Stack>
              </Stack>
            )}
            {createErrorMessage ? <Typography color="error.main">{createErrorMessage}</Typography> : null}
          </Stack>
        ) : null}
      </CardContent>
    </Card>
  );
}
