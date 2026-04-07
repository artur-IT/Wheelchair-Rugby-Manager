import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Box, Button, IconButton, TextField, Typography } from "@mui/material";
import { Grid } from "@mui/material";

interface PlayerRow {
  id: string;
  firstName: string;
  lastName: string;
  classification: string;
  number: string;
}

interface TeamPlayersSectionProps {
  players: PlayerRow[];
  updatePlayer: (id: string, field: keyof PlayerRow, value: string) => void;
  removePlayer: (id: string) => void;
  addPlayer: () => void;
  requiredFieldSx: object;
  classificationErrors: Record<string, string>;
  numberErrors: Record<string, string>;
}

export default function TeamPlayersSection({
  players,
  updatePlayer,
  removePlayer,
  addPlayer,
  requiredFieldSx,
  classificationErrors,
  numberErrors,
}: TeamPlayersSectionProps) {
  return (
    <>
      <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2 }}>
        Zawodnicy
      </Typography>
      {players.map((p) => (
        <Box
          key={p.id}
          sx={{
            mb: 2,
            p: 1.5,
            borderRadius: 2,
            backgroundColor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Grid container spacing={1.5} alignItems="center">
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Imię"
                required
                value={p.firstName}
                onChange={(e) => updatePlayer(p.id, "firstName", e.target.value)}
                sx={requiredFieldSx}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Nazwisko"
                required
                value={p.lastName}
                onChange={(e) => updatePlayer(p.id, "lastName", e.target.value)}
                sx={requiredFieldSx}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                inputProps={{ inputMode: "decimal" }}
                label="Klasyfikacja"
                value={p.classification}
                onChange={(e) => updatePlayer(p.id, "classification", e.target.value)}
                error={Boolean(classificationErrors[p.id])}
                helperText={classificationErrors[p.id]}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                inputProps={{ inputMode: "numeric" }}
                label="Numer"
                value={p.number}
                onChange={(e) => updatePlayer(p.id, "number", e.target.value)}
                error={Boolean(numberErrors[p.id])}
                helperText={numberErrors[p.id]}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <IconButton aria-label="Usuń zawodnika" onClick={() => removePlayer(p.id)} color="error" size="small">
                <DeleteOutlineIcon />
              </IconButton>
            </Grid>
          </Grid>
        </Box>
      ))}
      <Button type="button" variant="outlined" startIcon={<AddIcon />} onClick={addPlayer} sx={{ mb: 3 }}>
        Dodaj zawodnika
      </Button>
    </>
  );
}
