import { Box, Paper, Typography, Link as MuiLink } from "@mui/material";
import { MapPin } from "lucide-react";
import type { Accommodation, SportsHall, Tournament } from "@/types";

interface TournamentVenueCardsProps {
  tournament: Tournament;
  venue?: SportsHall;
  accommodation?: Accommodation;
}

export default function TournamentVenueCards({ tournament, venue, accommodation }: TournamentVenueCardsProps) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        gap: 3,
      }}
    >
      {venue ? (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              mb: 2,
            }}
          >
            <Box
              sx={{
                bgcolor: "#dbeafe",
                p: 1,
                borderRadius: 2,
                color: "#2563eb",
              }}
            >
              <MapPin size={20} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Hala Sportowa
            </Typography>
          </Box>
          <Typography sx={{ fontWeight: 600 }}>{venue.name}</Typography>
          <Typography color="textSecondary" sx={{ mb: 2 }}>
            {venue.address}
          </Typography>
          {venue.mapUrl ? (
            <MuiLink
              href={venue.mapUrl}
              target="_blank"
              rel="noreferrer"
              underline="hover"
              sx={{ fontWeight: "bold", fontSize: "0.875rem" }}
            >
              Otwórz w Mapach &rarr;
            </MuiLink>
          ) : null}
        </Paper>
      ) : null}

      {accommodation ? (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              mb: 2,
            }}
          >
            <Box
              sx={{
                bgcolor: "#d1fae5",
                p: 1,
                borderRadius: 2,
                color: "#059669",
              }}
            >
              <MapPin size={20} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Zakwaterowanie
            </Typography>
          </Box>
          <Typography sx={{ fontWeight: 600 }}>{accommodation.name}</Typography>
          <Typography color="textSecondary" sx={{ mb: 2 }}>
            {accommodation.address}
          </Typography>
          {tournament.parking ? (
            <Typography sx={{ mb: 2 }}>
              <strong>Parking:</strong> {tournament.parking}
            </Typography>
          ) : null}
          {accommodation.mapUrl ? (
            <MuiLink
              href={accommodation.mapUrl}
              target="_blank"
              rel="noreferrer"
              underline="hover"
              sx={{ fontWeight: "bold", fontSize: "0.875rem" }}
            >
              Otwórz w Mapach &rarr;
            </MuiLink>
          ) : null}
        </Paper>
      ) : null}

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mb: 2,
          }}
        >
          <Box
            sx={{
              bgcolor: "#fff7ed",
              p: 1,
              borderRadius: 2,
              color: "#d97706",
            }}
          >
            <MapPin size={20} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Wyżywienie
          </Typography>
        </Box>
        {tournament.catering ? (
          <Typography sx={{ fontWeight: 600, whiteSpace: "pre-wrap" }}>{tournament.catering}</Typography>
        ) : (
          <Typography color="textSecondary">Brak danych.</Typography>
        )}
      </Paper>
    </Box>
  );
}

