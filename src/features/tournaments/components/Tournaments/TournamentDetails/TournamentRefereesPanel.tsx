import { Box, Button, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import { Trash2 } from "lucide-react";
import type { Person, Tournament } from "@/types";

interface TournamentRefereesPanelProps {
  tournament: Tournament;
  personDisplayName: (p: Person) => string;
  openAddRefereesDialog: () => void;
  openRemoveRefereeDialog: (p: Person) => void;
  removeRefereeLoading: boolean;
  refereeToRemove: Person | null;
}

export default function TournamentRefereesPanel({
  tournament,
  personDisplayName,
  openAddRefereesDialog,
  openRemoveRefereeDialog,
  removeRefereeLoading,
  refereeToRemove,
}: TournamentRefereesPanelProps) {
  return (
    <Paper sx={{ p: 3, borderRadius: 3, maxWidth: "100%", minWidth: 0, boxSizing: "border-box", height: "100%" }}>
      <Typography variant="h6" sx={{ fontWeight: "bold", mb: 0.5 }}>
        Sędziowie
        <Box
          component="span"
          aria-hidden="true"
          sx={{ fontSize: "0.875rem", fontWeight: 400, color: "text.secondary", ml: 1 }}
        >
          ({tournament.referees.length})
        </Box>
      </Typography>
      {tournament.referees.length === 0 ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Typography variant="body2" color="textSecondary">
            Brak przypisanych sędziów.
          </Typography>
          <Button variant="contained" onClick={openAddRefereesDialog} sx={{ alignSelf: "flex-start" }}>
            Dodaj
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              width: "100%",
              minWidth: 0,
              alignItems: "stretch",
            }}
          >
            {tournament.referees.map((r) => (
              <Box
                key={r.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 0.5,
                  px: 1,
                  borderRadius: 2,
                  bgcolor: "background.paper",
                  width: "100%",
                  minWidth: 0,
                  boxSizing: "border-box",
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    flexShrink: 0,
                    bgcolor: "white",
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "divider",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    color: "primary.main",
                  }}
                >
                  {r.firstName?.[0] ?? "?"}
                </Box>
                <Typography sx={{ fontWeight: 500, flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>
                  {personDisplayName(r)}
                </Typography>
                <Tooltip title="Usuń sędziego z turnieju">
                  <span>
                    <IconButton
                      aria-label={`Usuń sędziego ${personDisplayName(r)} z turnieju`}
                      color="error"
                      onClick={() => openRemoveRefereeDialog(r)}
                      size="small"
                      disabled={removeRefereeLoading && refereeToRemove?.id === r.id}
                      sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 0 }}
                    >
                      <Trash2 size={18} />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            ))}
          </Box>
          <Button variant="outlined" onClick={openAddRefereesDialog} sx={{ alignSelf: "flex-start" }}>
            Dodaj
          </Button>
        </Box>
      )}
    </Paper>
  );
}
