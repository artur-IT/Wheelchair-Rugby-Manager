import { Box, Button, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import { Trash2 } from "lucide-react";
import type { Person, Tournament } from "@/types";

interface TournamentPersonnelPanelsProps {
  tournament: Tournament;
  personDisplayName: (p: Person) => string;
  openAddRefereesDialog: () => void;
  openRemoveRefereeDialog: (p: Person) => void;
  removeRefereeLoading: boolean;
  refereeToRemove: Person | null;
  openAddClassifiersDialog: () => void;
  openRemoveClassifierDialog: (p: Person) => void;
  removeClassifierLoading: boolean;
  classifierToRemove: Person | null;
}

export default function TournamentPersonnelPanels({
  tournament,
  personDisplayName,
  openAddRefereesDialog,
  openRemoveRefereeDialog,
  removeRefereeLoading,
  refereeToRemove,
  openAddClassifiersDialog,
  openRemoveClassifierDialog,
  removeClassifierLoading,
  classifierToRemove,
}: TournamentPersonnelPanelsProps) {

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
        Personel
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
        <Box>
          <Typography
            variant="caption"
            sx={{
              fontWeight: "bold",
              textTransform: "uppercase",
              color: "text.secondary",
              mb: 1,
              display: "flex",
              alignItems: "baseline",
              gap: 1,
            }}
          >
            Sędziowie
            <Box
              component="span"
              aria-hidden="true"
              sx={{ fontSize: "0.75rem", fontWeight: 400, color: "text.secondary" }}
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
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {tournament.referees.map((r) => (
                <Box
                  key={r.id}
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
                    {r.firstName?.[0] ?? "?"}
                  </Box>
                  <Typography sx={{ fontWeight: 500, flex: 1 }}>{personDisplayName(r)}</Typography>
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
              <Button variant="outlined" onClick={openAddRefereesDialog} sx={{ alignSelf: "flex-start" }}>
                Dodaj
              </Button>
            </Box>
          )}
        </Box>

        <Box>
          <Typography
            variant="caption"
            sx={{
              fontWeight: "bold",
              textTransform: "uppercase",
              color: "text.secondary",
              mb: 1,
              display: "flex",
              alignItems: "baseline",
              gap: 1,
            }}
          >
            Klasyfikatorzy
            <Box
              component="span"
              aria-hidden="true"
              sx={{ fontSize: "0.75rem", fontWeight: 400, color: "text.secondary" }}
            >
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
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {tournament.classifiers.map((c) => (
                <Box
                  key={c.id}
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
                    {c.firstName?.[0] ?? "?"}
                  </Box>
                  <Typography sx={{ fontWeight: 500, flex: 1 }}>{personDisplayName(c)}</Typography>
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
              <Button variant="outlined" onClick={openAddClassifiersDialog} sx={{ alignSelf: "flex-start" }}>
                Dodaj
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </Paper>
  );
}
