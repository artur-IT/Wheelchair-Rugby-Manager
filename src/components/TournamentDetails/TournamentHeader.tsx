import { Box, Button, Typography, Link as MuiLink } from "@mui/material";
import type { Tournament } from "@/types";

interface TournamentHeaderProps {
  id: string;
  tournament: Tournament;
  formatDateRange: (start: string, end?: string) => string;
}

export default function TournamentHeader({ id, tournament, formatDateRange }: TournamentHeaderProps) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}
    >
      <Box>
        <MuiLink
          href="/tournaments"
          underline="hover"
          sx={{
            color: "primary.main",
            fontWeight: 600,
            fontSize: "0.875rem",
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            mb: 1,
          }}
        >
          &larr; Powrót do listy
        </MuiLink>
        <Typography variant="h3" sx={{ fontWeight: 900 }}>
          {tournament.name}
        </Typography>
        <Typography color="textSecondary">{formatDateRange(tournament.startDate, tournament.endDate)}</Typography>
      </Box>
      <Box sx={{ display: "flex", gap: 1.5 }}>
        <Button
          component="a"
          href={`/tournaments/${id}/edit`}
          variant="contained"
          sx={{ borderRadius: 4, fontWeight: "bold" }}
        >
          Edytuj turniej
        </Button>
      </Box>
    </Box>
  );
}
