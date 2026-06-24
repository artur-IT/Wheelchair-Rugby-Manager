import { Box, Button, Typography, Link as MuiLink } from "@mui/material";
import { formatDateRangePl } from "@/lib/dateFormat";
import type { Tournament } from "@/types";

interface TournamentHeaderProps {
  id: string;
  tournament: Tournament;
}

export default function TournamentHeader({ id, tournament }: TournamentHeaderProps) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
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
        <Typography
          variant="h4"
          sx={{
            fontWeight: 900,
            // Smaller title on narrow portrait so long names fit without dominating the screen.
            "@media (max-width: 599.95px) and (orientation: portrait)": {
              fontSize: "1.375rem",
              lineHeight: 1.25,
              wordBreak: "break-word",
            },
          }}
        >
          {tournament.name}
        </Typography>
        <Typography color="textSecondary">{formatDateRangePl(tournament.startDate, tournament.endDate)}</Typography>
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
