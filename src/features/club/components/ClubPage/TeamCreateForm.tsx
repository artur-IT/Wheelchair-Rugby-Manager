import { Button, MenuItem, Stack, TextField, Typography } from "@mui/material";

import type { ClubCoachDto, ClubPlayerDto } from "./types";

interface TeamCreateFormProps {
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
}

export default function TeamCreateForm({
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
}: TeamCreateFormProps) {
  return (
    <Stack gap={2} sx={{ mb: 3 }}>
      <TextField label="Nazwa drużyny" value={teamName} onChange={(e) => onTeamNameChange(e.target.value)} />
      <Stack direction={{ xs: "column", md: "row" }} gap={2}>
        <TextField
          select
          label="Formuła"
          value={teamFormula}
          onChange={(e) => onTeamFormulaChange(e.target.value as "WR4" | "WR5")}
          fullWidth
        >
          <MenuItem value="WR4">WR&apos;4</MenuItem>
          <MenuItem value="WR5">WR&apos;5</MenuItem>
        </TextField>
        <TextField
          select
          label="Trener"
          value={teamCoachId}
          onChange={(e) => onTeamCoachChange(e.target.value)}
          fullWidth
        >
          <MenuItem value="">Bez trenera</MenuItem>
          {coaches.map((coach) => (
            <MenuItem key={coach.id} value={coach.id}>
              {coach.firstName} {coach.lastName}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
      <TextField
        select
        label="Zawodnicy (możesz wybrać wielu)"
        value={teamPlayerIds}
        onChange={(e) => {
          const value = e.target.value;
          onTeamPlayersChange(typeof value === "string" ? value.split(",").filter(Boolean) : value);
        }}
        SelectProps={{ multiple: true }}
      >
        {players.map((player) => (
          <MenuItem key={player.id} value={player.id}>
            {player.firstName} {player.lastName}
          </MenuItem>
        ))}
      </TextField>
      <Button variant="contained" disabled={!teamName.trim() || isPending} onClick={onCreateTeam}>
        Zapisz drużynę
      </Button>
      {errorMessage ? <Typography color="error.main">{errorMessage}</Typography> : null}
    </Stack>
  );
}
