import { MapPin } from "lucide-react";
import { Box, Link as MuiLink, Paper, Typography } from "@mui/material";
import { formatAddressForDisplay, resolvePlaceMapsHref } from "@/lib/addressDisplay";
import type { Tournament } from "@/types";

interface TournamentInfoPanelsProps {
  tournament: Tournament;
}

export default function TournamentInfoPanels({ tournament }: TournamentInfoPanelsProps) {
  const mealLocationLabel = (location?: Tournament["breakfastLocation"]) => {
    if (location === "HALL") return "Hala";
    if (location === "HOTEL") return "Hotel";
    return "Brak danych";
  };
  const hasStructuredCatering = Boolean(
    tournament.breakfastServingTime ||
    tournament.lunchServingTime ||
    tournament.dinnerServingTime ||
    tournament.cateringNotes
  );

  const venue = tournament.venue;
  const accommodation = tournament.accommodation;
  const venueMapsHref = resolvePlaceMapsHref(venue);
  const accommodationMapsHref = resolvePlaceMapsHref(accommodation);
  const cardSx = {
    p: 3,
    borderRadius: 3,
    bgcolor: "background.paper",
    border: 1,
    borderColor: "divider",
    width: 400,
    minWidth: 400,
    maxWidth: 400,
    flex: "0 0 400px",
    boxSizing: "border-box",
  } as const;

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 3,
        alignItems: "stretch",
        overflowX: "auto",
      }}
    >
      {venue ? (
        <Paper variant="outlined" sx={cardSx}>
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
          <Typography color="textSecondary" sx={{ mb: 1, whiteSpace: "pre-line", overflowWrap: "anywhere" }}>
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
        <Paper variant="outlined" sx={cardSx}>
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
          <Typography color="textSecondary" sx={{ mb: 1, whiteSpace: "pre-line", overflowWrap: "anywhere" }}>
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

      <Paper variant="outlined" sx={cardSx}>
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
        {hasStructuredCatering ? (
          <Box sx={{ display: "grid", gap: 1 }}>
            <Typography>
              <strong>Śniadania:</strong> {tournament.breakfastServingTime || "Brak danych"} | <strong>Miejsce:</strong>{" "}
              {mealLocationLabel(tournament.breakfastLocation)}
            </Typography>
            <Typography>
              <strong>Obiady:</strong> {tournament.lunchServingTime || "Brak danych"} | <strong>Miejsce:</strong>{" "}
              {mealLocationLabel(tournament.lunchLocation)}
            </Typography>
            <Typography>
              <strong>Kolacje:</strong> {tournament.dinnerServingTime || "Brak danych"} | <strong>Miejsce:</strong>{" "}
              {mealLocationLabel(tournament.dinnerLocation)}
            </Typography>
            {tournament.cateringNotes ? (
              <Typography sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                <strong>Uwagi:</strong> {tournament.cateringNotes}
              </Typography>
            ) : null}
          </Box>
        ) : tournament.catering ? (
          <Typography sx={{ fontWeight: 600, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
            {tournament.catering}
          </Typography>
        ) : (
          <Typography color="textSecondary">Brak danych.</Typography>
        )}
      </Paper>
    </Box>
  );
}
