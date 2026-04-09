import { Box, Button, Card, CardContent, CircularProgress, Stack, TextField, Typography } from "@mui/material";

import type { ClubDto } from "./types";

interface ClubHeaderCardProps {
  isLoading: boolean;
  errorMessage: string | null;
  selectedClub: ClubDto | null;
  clubContactItems: string[];
  clubHallItems: string[];
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
  clubContactItems,
  clubHallItems,
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
          <Stack gap={1} sx={{ mt: 2 }}>
            <Stack direction="row" alignItems="center" gap={1}>
              {selectedClub.logoUrl ? (
                <Box
                  component="img"
                  src={selectedClub.logoUrl}
                  alt={`Logo klubu ${selectedClub.name}`}
                  sx={{ width: "4em", height: "4em", objectFit: "contain", flexShrink: 0 }}
                />
              ) : null}
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {selectedClub.name}
              </Typography>
            </Stack>
            {clubContactItems.length > 0 ? (
              <Stack gap={0.5}>
                {clubContactItems.map((item, index) => (
                  <Typography key={index} color="text.secondary" variant="body2">
                    {item}
                  </Typography>
                ))}
              </Stack>
            ) : null}
            {clubHallItems.length > 0 ? (
              <Stack gap={0.5} sx={{ pt: 1 }}>
                <Typography variant="subtitle2">Trenujemy</Typography>
                {clubHallItems.map((item) => (
                  <Typography key={item} color="text.secondary" variant="body2">
                    {item}
                  </Typography>
                ))}
                {selectedClub.hallMapUrl ? (
                  <Box sx={{ pt: 0.5 }}>
                    <Button
                      variant="text"
                      component="a"
                      href={selectedClub.hallMapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Otwórz mapę
                    </Button>
                  </Box>
                ) : null}
              </Stack>
            ) : null}
            <Box sx={{ pt: 1 }}>
              <Button variant="outlined" onClick={onShowClubEditForm}>
                Edytuj
              </Button>
            </Box>
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
                  onChange={(e) => onClubLogoFileChange(e.target.files?.[0] ?? null)}
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
