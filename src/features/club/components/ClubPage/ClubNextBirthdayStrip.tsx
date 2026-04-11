import { useMemo } from "react";
import { Box, Typography } from "@mui/material";

import { getNextClubBirthdayBannerParts } from "@/features/club/lib/nextClubBirthday";

import type { ClubPlayerDto } from "./types";

interface ClubNextBirthdayStripProps {
  players: ClubPlayerDto[];
  isLoading: boolean;
}

export default function ClubNextBirthdayStrip({ players, isLoading }: ClubNextBirthdayStripProps) {
  const parts = useMemo(() => {
    if (isLoading) return null;
    return getNextClubBirthdayBannerParts(players);
  }, [players, isLoading]);

  if (!parts) return null;

  return (
    <Box
      component="aside"
      aria-live="polite"
      sx={{
        alignSelf: "center",
        maxWidth: 500,
        width: "100%",
        py: 0.75,
        px: 2,
        borderRadius: 1,
        border: 1,
        borderColor: "orange",
        bgcolor: (theme) => (theme.palette.mode === "dark" ? "action.hover" : "grey.50"),
      }}
    >
      <Typography variant="caption" component="p" sx={{ m: 0, textAlign: "center", lineHeight: 1.4 }}>
        <Box component="span" sx={{ fontWeight: 700 }}>
          {parts.lead}
        </Box>
        {parts.rest}
      </Typography>
    </Box>
  );
}
