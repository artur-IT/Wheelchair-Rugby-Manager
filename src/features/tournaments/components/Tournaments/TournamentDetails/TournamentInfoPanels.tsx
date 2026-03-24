import { MapPin } from "lucide-react";
import { Box, Link as MuiLink, Paper, Typography } from "@mui/material";
import { formatAddressForDisplay, resolvePlaceMapsHref } from "@/lib/addressDisplay";
import type { Tournament } from "@/types";

interface TournamentInfoPanelsProps {
  tournament: Tournament;
}

export default function TournamentInfoPanels({ tournament }: TournamentInfoPanelsProps) {
  const venue = tournament.venue;
  const accommodation = tournament.accommodation;
  const venueMapsHref = resolvePlaceMapsHref(venue);
  const accommodationMapsHref = resolvePlaceMapsHref(accommodation);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
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
          <Typography color="textSecondary" sx={{ mb: 1, whiteSpace: "pre-line" }}>
            {formatAddressForDisplay(venue.address)}
          </Typography>
          {venueMapsHref ? (
            <MuiLink
              href={venueMapsHref}
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
          <Typography color="textSecondary" sx={{ mb: 1, whiteSpace: "pre-line" }}>
            {formatAddressForDisplay(accommodation.address)}
          </Typography>
          {tournament.parking ? (
            <Typography sx={{ mb: 1 }}>
              <strong>Parking:</strong> {tournament.parking}
            </Typography>
          ) : null}
          {accommodationMapsHref ? (
            <MuiLink
              href={accommodationMapsHref}
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
