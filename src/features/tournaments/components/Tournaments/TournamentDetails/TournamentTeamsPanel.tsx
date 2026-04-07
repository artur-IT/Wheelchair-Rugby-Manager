import { Box, Button, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import { Trash2 } from "lucide-react";
import type { Team, Tournament } from "@/types";

interface TournamentTeamsPanelProps {
  tournament: Tournament;
  openAddTeamsDialog: () => void;
  openRemoveTeamDialog: (team: Team) => void;
  openEditTeamPlayersDialog: (team: Team) => void;
  removeTeamLoading: boolean;
  teamToRemove: Team | null;
}

export default function TournamentTeamsPanel({
  tournament,
  openAddTeamsDialog,
  openRemoveTeamDialog,
  openEditTeamPlayersDialog,
  removeTeamLoading,
  teamToRemove,
}: TournamentTeamsPanelProps) {
  return (
    <Paper sx={{ p: 3, borderRadius: 3, maxWidth: "100%", minWidth: 0, boxSizing: "border-box", height: "100%" }}>
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
          <Button
            variant="contained"
            onClick={openAddTeamsDialog}
            aria-label="Dodaj drużyny do turnieju"
            sx={{ alignSelf: "flex-start" }}
          >
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
            {tournament.teams.map((team) => (
              <Box
                key={team.id}
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
                    color: "info.main",
                  }}
                >
                  {team.name[0] ?? "?"}
                </Box>
                <Button
                  variant="text"
                  onClick={() => openEditTeamPlayersDialog(team)}
                  aria-label={`Edytuj zawodników drużyny ${team.name}`}
                  sx={{
                    color: "info.main",
                    fontWeight: 500,
                    flex: 1,
                    width: "100%",
                    minWidth: 0,
                    justifyContent: "flex-start",
                    textAlign: "left",
                    whiteSpace: "normal",
                    px: 0,
                    overflowWrap: "anywhere",
                    "&:hover": { color: "info.dark" },
                  }}
                >
                  {team.name}
                </Button>
                <Typography variant="body2" color="text.secondary">
                  ({team.players?.length ?? 0})
                </Typography>
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
          <Button
            variant="outlined"
            onClick={openAddTeamsDialog}
            aria-label="Dodaj drużyny do turnieju"
            sx={{ alignSelf: "flex-start" }}
          >
            Dodaj
          </Button>
        </Box>
      )}
    </Paper>
  );
}
