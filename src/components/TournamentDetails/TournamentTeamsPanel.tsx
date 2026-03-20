import { Box, Button, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import { Trash2 } from "lucide-react";
import type { Team, Tournament } from "@/types";

interface TournamentTeamsPanelProps {
  tournament: Tournament;
  openAddTeamsDialog: () => void;
  openRemoveTeamDialog: (team: Team) => void;
  removeTeamLoading: boolean;
  teamToRemove: Team | null;
}

export default function TournamentTeamsPanel({
  tournament,
  openAddTeamsDialog,
  openRemoveTeamDialog,
  removeTeamLoading,
  teamToRemove,
}: TournamentTeamsPanelProps) {
  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: "bold", mb: 0.5 }}>
        Drużyny
        <Box
          component="span"
          aria-hidden="true"
          sx={{ fontSize: "0.875rem", fontWeight: 400, color: "text.secondary", ml: 1 }}
        >
          ({tournament.teams.length})
        </Box>
      </Typography>
      {tournament.teams.length === 0 ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Typography variant="body2" color="textSecondary">
            Brak przypisanych drużyn.
          </Typography>
          <Button variant="contained" onClick={openAddTeamsDialog} sx={{ alignSelf: "flex-start" }}>
            Dodaj
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {tournament.teams.map((team) => (
              <Box
                key={team.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "grey.50",
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: "white",
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "grey.200",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    color: "primary.main",
                  }}
                >
                  {team.name[0] ?? "?"}
                </Box>
                <Typography sx={{ fontWeight: 500, flex: 1 }}>{team.name}</Typography>
                <Tooltip title="Usuń drużynę z turnieju">
                  <span>
                    <IconButton
                      aria-label={`Usuń drużynę ${team.name} z turnieju`}
                      color="error"
                      onClick={() => openRemoveTeamDialog(team)}
                      size="small"
                      disabled={removeTeamLoading && teamToRemove?.id === team.id}
                      sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 0 }}
                    >
                      <Trash2 size={18} />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            ))}
          </Box>
          <Button variant="outlined" onClick={openAddTeamsDialog} sx={{ alignSelf: "flex-start" }}>
            Dodaj
          </Button>
        </Box>
      )}
    </Paper>
  );
}
