import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Button, Grid, IconButton, TextField, Typography } from "@mui/material";

interface StaffRow {
  id: string;
  firstName: string;
  lastName: string;
}

interface TeamStaffSectionProps {
  staff: StaffRow[];
  updateStaff: (id: string, field: keyof StaffRow, value: string) => void;
  removeStaff: (id: string) => void;
  addStaff: () => void;
}

export default function TeamStaffSection({ staff, updateStaff, removeStaff, addStaff }: TeamStaffSectionProps) {
  return (
    <>
      <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2 }}>
        Staff
      </Typography>
      {staff.map((s) => (
        <Grid container spacing={2} key={s.id} alignItems="center" sx={{ mb: 1 }}>
          <Grid size={{ xs: 12, sm: 5 }}>
            <TextField
              fullWidth
              size="small"
              label="Imię"
              value={s.firstName}
              onChange={(e) => updateStaff(s.id, "firstName", e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 5 }}>
            <TextField
              fullWidth
              size="small"
              label="Nazwisko"
              value={s.lastName}
              onChange={(e) => updateStaff(s.id, "lastName", e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 2 }}>
            <IconButton aria-label="Usuń" onClick={() => removeStaff(s.id)} color="error" size="small">
              <DeleteOutlineIcon />
            </IconButton>
          </Grid>
        </Grid>
      ))}
      <Button type="button" variant="outlined" startIcon={<AddIcon />} onClick={addStaff} sx={{ mb: 3 }}>
        Dodaj osobę ze staffu
      </Button>
    </>
  );
}
