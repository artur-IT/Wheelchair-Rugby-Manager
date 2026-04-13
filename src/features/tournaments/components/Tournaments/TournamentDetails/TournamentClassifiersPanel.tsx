import { Box, Button, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import { Trash2 } from "lucide-react";
import type { Person, Tournament } from "@/types";

interface TournamentClassifiersPanelProps {
  tournament: Tournament;
  personDisplayName: (p: Person) => string;
  openAddClassifiersDialog: () => void;
  openRemoveClassifierDialog: (p: Person) => void;
  removeClassifierLoading: boolean;
  classifierToRemove: Person | null;
}

export default function TournamentClassifiersPanel({
  tournament,
  personDisplayName,
  openAddClassifiersDialog,
  openRemoveClassifierDialog,
  removeClassifierLoading,
  classifierToRemove,
}: TournamentClassifiersPanelProps) {
  return (
    <Paper sx={{ p: 3, borderRadius: 3, maxWidth: "100%", minWidth: 0, boxSizing: "border-box", height: "100%" }}>
      <Typography variant="h6" sx={{ fontWeight: "bold", mb: 0.5 }}>
        Klasyfikatorzy
        <Box component="span" sx={{ fontSize: "0.875rem", fontWeight: 400, color: "text.secondary", ml: 1 }}>
          ({tournament.classifiers.length})
        </Box>
      </Typography>
      {tournament.classifiers.length === 0 ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Typography variant="body2" color="textSecondary">
            Brak przypisanych klasyfikatorów.
          </Typography>
          <Button variant="contained" onClick={openAddClassifiersDialog} sx={{ alignSelf: "flex-start" }}>
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
            {tournament.classifiers.map((c) => (
              <Box
                key={c.id}
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
                  {c.firstName?.[0] ?? "?"}
                </Box>
                <Typography sx={{ fontWeight: 500, flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>
                  {personDisplayName(c)}
                </Typography>
                <Tooltip title="Usuń klasyfikatora z turnieju">
                  <span>
                    <IconButton
                      aria-label={`Usuń klasyfikatora ${personDisplayName(c)} z turnieju`}
                      color="error"
                      onClick={() => openRemoveClassifierDialog(c)}
                      size="small"
                      disabled={removeClassifierLoading && classifierToRemove?.id === c.id}
                      sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 0 }}
                    >
                      <Trash2 size={18} />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            ))}
          </Box>
          <Button variant="outlined" onClick={openAddClassifiersDialog} sx={{ alignSelf: "flex-start" }}>
            Dodaj
          </Button>
        </Box>
      )}
    </Paper>
  );
}
