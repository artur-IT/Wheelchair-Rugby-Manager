import { Box, Button, Card, CardContent, CircularProgress, Typography } from "@mui/material";

import TeamCreateForm from "./TeamCreateForm";
import TeamTile from "./TeamTile";
import type { ClubCoachDto, ClubPlayerDto, ClubTeamDto } from "./types";

interface TeamsSectionCardProps {
  teams: ClubTeamDto[];
  isTeamsLoading: boolean;
  showTeamForm: boolean;
  coaches: ClubCoachDto[];
  players: ClubPlayerDto[];
  teamName: string;
  teamFormula: "WR4" | "WR5";
  teamCoachId: string;
  teamPlayerIds: string[];
  createTeamErrorMessage: string | null;
  isCreateTeamPending: boolean;
  onShowTeamForm: () => void;
  onTeamNameChange: (value: string) => void;
  onTeamFormulaChange: (value: "WR4" | "WR5") => void;
  onTeamCoachChange: (value: string) => void;
  onTeamPlayersChange: (value: string[]) => void;
  onCreateTeam: () => void;
}

export default function TeamsSectionCard({
  teams,
  isTeamsLoading,
  showTeamForm,
  coaches,
  players,
  teamName,
  teamFormula,
  teamCoachId,
  teamPlayerIds,
  createTeamErrorMessage,
  isCreateTeamPending,
  onShowTeamForm,
  onTeamNameChange,
  onTeamFormulaChange,
  onTeamCoachChange,
  onTeamPlayersChange,
  onCreateTeam,
}: TeamsSectionCardProps) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Drużyny
        </Typography>
        {isTeamsLoading ? <CircularProgress size={22} /> : null}

        {!isTeamsLoading && teams.length === 0 && !showTeamForm ? (
          <Button variant="contained" onClick={onShowTeamForm}>
            Utwórz drużynę
          </Button>
        ) : null}

        {showTeamForm ? (
          <TeamCreateForm
            teamName={teamName}
            teamFormula={teamFormula}
            teamCoachId={teamCoachId}
            teamPlayerIds={teamPlayerIds}
            coaches={coaches}
            players={players}
            isPending={isCreateTeamPending}
            errorMessage={createTeamErrorMessage}
            onTeamNameChange={onTeamNameChange}
            onTeamFormulaChange={onTeamFormulaChange}
            onTeamCoachChange={onTeamCoachChange}
            onTeamPlayersChange={onTeamPlayersChange}
            onCreateTeam={onCreateTeam}
          />
        ) : null}

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 1.5 }}>
          {teams.map((team) => (
            <TeamTile key={team.id} team={team} />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
