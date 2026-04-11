import { useState } from "react";
import { Box, Button, Card, CardContent, CircularProgress, Typography } from "@mui/material";

import ConfirmationDialog from "@/components/ui/ConfirmationDialog";

import TeamCreateForm from "./TeamCreateForm";
import TeamTile from "./TeamTile";
import type { ClubCoachDto, ClubPlayerDto, ClubTeamDto } from "./types";

interface TeamsSectionCardProps {
  teams: ClubTeamDto[];
  isTeamsLoading: boolean;
  showTeamForm: boolean;
  isEditingTeam: boolean;
  coaches: ClubCoachDto[];
  players: ClubPlayerDto[];
  teamName: string;
  teamFormula: "WR4" | "WR5";
  teamCoachId: string;
  teamPlayerIds: string[];
  teamFormErrorMessage: string | null;
  isTeamFormPending: boolean;
  teamPendingDelete: ClubTeamDto | null;
  deleteTeamErrorMessage: string | null;
  isDeleteTeamPending: boolean;
  onShowTeamForm: () => void;
  onTeamNameChange: (value: string) => void;
  onTeamFormulaChange: (value: "WR4" | "WR5") => void;
  onTeamCoachChange: (value: string) => void;
  onTeamPlayersChange: (value: string[]) => void;
  onSubmitTeamForm: () => void;
  onCancelTeamForm: () => void;
  onEditTeam: (team: ClubTeamDto) => void;
  onTeamPendingDeleteChange: (team: ClubTeamDto | null) => void;
  onConfirmDeleteTeam: () => void;
}

export default function TeamsSectionCard({
  teams,
  isTeamsLoading,
  showTeamForm,
  isEditingTeam,
  coaches,
  players,
  teamName,
  teamFormula,
  teamCoachId,
  teamPlayerIds,
  teamFormErrorMessage,
  isTeamFormPending,
  teamPendingDelete,
  deleteTeamErrorMessage,
  isDeleteTeamPending,
  onShowTeamForm,
  onTeamNameChange,
  onTeamFormulaChange,
  onTeamCoachChange,
  onTeamPlayersChange,
  onSubmitTeamForm,
  onCancelTeamForm,
  onEditTeam,
  onTeamPendingDeleteChange,
  onConfirmDeleteTeam,
}: TeamsSectionCardProps) {
  const [expandedTeamId, setExpandedTeamId] = useState<string | false>(false);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Drużyny
        </Typography>
        {isTeamsLoading ? <CircularProgress size={22} /> : null}

        {!isTeamsLoading && !showTeamForm ? (
          <Button variant="contained" onClick={onShowTeamForm} sx={{ mb: teams.length > 0 ? 2 : 0 }}>
            Dodaj drużynę
          </Button>
        ) : null}

        {showTeamForm ? (
          <TeamCreateForm
            isEditing={isEditingTeam}
            teamName={teamName}
            teamFormula={teamFormula}
            teamCoachId={teamCoachId}
            teamPlayerIds={teamPlayerIds}
            coaches={coaches}
            players={players}
            isPending={isTeamFormPending}
            errorMessage={teamFormErrorMessage}
            onTeamNameChange={onTeamNameChange}
            onTeamFormulaChange={onTeamFormulaChange}
            onTeamCoachChange={onTeamCoachChange}
            onTeamPlayersChange={onTeamPlayersChange}
            onCreateTeam={onSubmitTeamForm}
            onCancelTeamForm={onCancelTeamForm}
          />
        ) : null}

        <Box
          sx={{
            display: "grid",
            // Desktop: always two equal columns so one team occupies half width; two teams span full row.
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
            gap: 1.5,
            // Stretch tiles horizontally to fill each column; alignItems:start keeps row height per tile.
            justifyItems: "stretch",
            alignItems: "start",
          }}
        >
          {teams.map((team) => (
            <TeamTile
              key={team.id}
              team={team}
              expanded={expandedTeamId === team.id}
              onExpandChange={(next) => setExpandedTeamId(next ? team.id : false)}
              onEditTeam={onEditTeam}
              onRequestDeleteTeam={(t) => onTeamPendingDeleteChange(t)}
              isDeletePending={isDeleteTeamPending && teamPendingDelete?.id === team.id}
            />
          ))}
        </Box>

        <ConfirmationDialog
          open={teamPendingDelete !== null}
          title="Usunąć drużynę?"
          description={
            teamPendingDelete ? (
              <>
                Czy na pewno usunąć drużynę <strong>{teamPendingDelete.name}</strong>? Ta operacja jest trwała.
              </>
            ) : null
          }
          errorMessage={deleteTeamErrorMessage}
          loading={isDeleteTeamPending}
          onClose={() => onTeamPendingDeleteChange(null)}
          onConfirm={onConfirmDeleteTeam}
        />
      </CardContent>
    </Card>
  );
}
