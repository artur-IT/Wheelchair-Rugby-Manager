import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import type { ClubCoachDto, ClubPlayerDto } from "./types";

interface TeamCreateFormProps {
  isEditing?: boolean;
  teamName: string;
  teamFormula: "WR4" | "WR5";
  teamCoachId: string;
  teamPlayerIds: string[];
  coaches: ClubCoachDto[];
  players: ClubPlayerDto[];
  isPending: boolean;
  errorMessage: string | null;
  onTeamNameChange: (value: string) => void;
  onTeamFormulaChange: (value: "WR4" | "WR5") => void;
  onTeamCoachChange: (value: string) => void;
  onTeamPlayersChange: (value: string[]) => void;
  onCreateTeam: () => void;
  onCancelTeamForm: () => void;
}

export default function TeamCreateForm({
  isEditing = false,
  teamName,
  teamFormula,
  teamCoachId,
  teamPlayerIds,
  coaches,
  players,
  isPending,
  errorMessage,
  onTeamNameChange,
  onTeamFormulaChange,
  onTeamCoachChange,
  onTeamPlayersChange,
  onCreateTeam,
  onCancelTeamForm,
}: TeamCreateFormProps) {
  const formulaField = (
    <TextField
      select
      label="Formuła"
      value={teamFormula}
      onChange={(e) => onTeamFormulaChange(e.target.value as "WR4" | "WR5")}
      fullWidth
      sx={{ flex: { md: "0 0 160px" }, minWidth: 0 }}
    >
      <MenuItem value="WR4">WR&apos;4</MenuItem>
      <MenuItem value="WR5">WR&apos;5</MenuItem>
    </TextField>
  );

  const coachField = (
    <TextField
      select
      label="Trener"
      value={teamCoachId}
      onChange={(e) => onTeamCoachChange(e.target.value)}
      fullWidth
      sx={{ flex: { md: "1 1 0" }, minWidth: 0 }}
    >
      <MenuItem value="">Bez trenera</MenuItem>
      {coaches.map((coach) => (
        <MenuItem key={coach.id} value={coach.id}>
          {coach.firstName} {coach.lastName}
        </MenuItem>
      ))}
    </TextField>
  );

  return (
    <Stack gap={2} sx={{ mb: 3 }}>
      <Stack direction={{ xs: "column", md: "row" }} gap={2} sx={{ alignItems: { md: "flex-start" } }}>
        <TextField
          label="Nazwa drużyny"
          value={teamName}
          onChange={(e) => onTeamNameChange(e.target.value)}
          fullWidth
          sx={{ flex: { md: "1 1 0" }, minWidth: 0 }}
        />
        {formulaField}
        {coachField}
      </Stack>
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Zawodnicy w drużynie
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Zaznacz checkbox przy osobach, które mają być w składzie.
        </Typography>
        {players.length === 0 ? (
          <Typography variant="body2" color="text.disabled">
            Brak zawodników w klubie — dodaj ich w zakładce Zawodnicy.
          </Typography>
        ) : (
          <FormGroup
            sx={{
              maxHeight: 280,
              overflow: "auto",
              pr: 0.5,
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              p: 1,
              bgcolor: (theme) => (theme.palette.mode === "dark" ? "action.hover" : theme.palette.grey[50]),
            }}
          >
            {players.map((player) => {
              const label = `${player.firstName} ${player.lastName}`;
              const checked = teamPlayerIds.includes(player.id);
              return (
                <FormControlLabel
                  key={player.id}
                  control={
                    <Checkbox
                      size="small"
                      checked={checked}
                      onChange={() => {
                        onTeamPlayersChange(
                          checked ? teamPlayerIds.filter((id) => id !== player.id) : [...teamPlayerIds, player.id]
                        );
                      }}
                    />
                  }
                  label={label}
                  sx={{ mr: 0, alignItems: "center", py: 0.25 }}
                />
              );
            })}
          </FormGroup>
        )}
      </Box>
      <Stack direction="row" gap={1.5} flexWrap="wrap">
        <Button variant="outlined" disabled={isPending} onClick={onCancelTeamForm}>
          Anuluj
        </Button>
        <Button variant="contained" disabled={!teamName.trim() || isPending} onClick={onCreateTeam}>
          {isEditing ? "Zapisz zmiany" : "Zapisz drużynę"}
        </Button>
      </Stack>
      {errorMessage ? <Typography color="error.main">{errorMessage}</Typography> : null}
    </Stack>
  );
}
