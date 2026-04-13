import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { PersonnelTableProps } from "@/features/settings/components/SettingsPage/types";

export default function PersonnelTable({ title, data, onAddClick, onEdit, onDelete, deletingId }: PersonnelTableProps) {
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          {title}
        </Typography>
        {onAddClick ? (
          <Button variant="contained" size="small" onClick={onAddClick}>
            + Dodaj Osobę
          </Button>
        ) : null}
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "background.default" }}>
              <TableCell sx={{ fontWeight: "bold" }}>Imię i Nazwisko</TableCell>
              <TableCell sx={{ fontWeight: "bold", textAlign: "center" }}>Email</TableCell>
              <TableCell sx={{ fontWeight: "bold", textAlign: "center" }}>Telefon</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Uwagi</TableCell>
              <TableCell sx={{ fontWeight: "bold", textAlign: "center" }}>Operacje</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((person) => (
              <TableRow key={person.id} hover>
                <TableCell>
                  {person.firstName} {person.lastName}
                </TableCell>
                <TableCell align="center">{person.email ?? "-"}</TableCell>
                <TableCell align="center">{person.phone ?? "-"}</TableCell>
                <TableCell sx={{ maxWidth: 200, wordBreak: "break-word" }}>
                  {person.notes ? person.notes : "-"}
                </TableCell>
                <TableCell align="center">
                  <Button size="small" color="primary" onClick={() => onEdit?.(person)} disabled={!onEdit}>
                    Edytuj
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => onDelete?.(person)}
                    disabled={!onDelete || deletingId === person.id}
                  >
                    {deletingId === person.id ? "Usuwanie..." : "Usuń"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
