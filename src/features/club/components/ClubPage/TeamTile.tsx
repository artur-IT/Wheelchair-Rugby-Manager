import { Card, CardContent, Chip, Stack, Typography } from "@mui/material";

import type { ClubTeamDto } from "./types";

interface TeamTileProps {
  team: ClubTeamDto;
}

export default function TeamTile({ team }: TeamTileProps) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
          <Typography sx={{ fontWeight: 700 }}>{team.name}</Typography>
          <Chip label={team.formula === "WR4" ? "WR'4" : "WR'5"} size="small" />
        </Stack>
        <Typography color="text.secondary" variant="body2">
          Formuła: {team.formula === "WR4" ? "WR'4" : "WR'5"}
        </Typography>
        <Typography color="text.secondary" variant="body2">
          Liczba zawodników: {team.players.length}
        </Typography>
        <Typography color="text.secondary" variant="body2">
          Trener: {team.coach ? `${team.coach.firstName} ${team.coach.lastName}` : "brak"}
        </Typography>
      </CardContent>
    </Card>
  );
}
