import { prisma } from "@/lib/prisma";
import type { RefereePlanMatch, RefereeRole, UpsertRefereePlanMatchDto } from "@/types";

const roleToDtoKey: Record<
  RefereeRole,
  keyof Pick<UpsertRefereePlanMatchDto, "referee1Id" | "referee2Id" | "tablePenaltyId" | "tableClockId">
> = {
  REFEREE_1: "referee1Id",
  REFEREE_2: "referee2Id",
  TABLE_PENALTY: "tablePenaltyId",
  TABLE_CLOCK: "tableClockId",
};

function pickRefereeIdForRole(input: UpsertRefereePlanMatchDto, role: RefereeRole): string | undefined {
  const key = roleToDtoKey[role];
  const v = input[key];
  const trimmed = typeof v === "string" ? v.trim() : undefined;
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

async function validateTournamentAndRoles(tournamentId: string, refereeIds: string[]) {
  if (refereeIds.length === 0) return;

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true },
  });
  if (!tournament) throw new Error("TOURNAMENT_NOT_FOUND");

  const refs = await prisma.referee.findMany({
    where: { id: { in: refereeIds } },
    select: { id: true },
  });
  if (refs.length !== refereeIds.length) throw new Error("REFEREE_NOT_FOUND");

  const tournamentRefs = await prisma.tournamentReferee.findMany({
    where: { tournamentId, refereeId: { in: refereeIds } },
    select: { refereeId: true },
  });
  const allowed = new Set(tournamentRefs.map((r) => r.refereeId));
  const missing = refereeIds.find((id) => !allowed.has(id));
  if (missing) throw new Error("REFEREE_NOT_IN_TOURNAMENT");
}

function dedupeAndValidateRefereesPerMatch(input: UpsertRefereePlanMatchDto) {
  const ids = [input.referee1Id, input.referee2Id, input.tablePenaltyId, input.tableClockId]
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter((v) => v.length > 0);

  const uniqueCount = new Set(ids).size;
  if (uniqueCount !== ids.length) throw new Error("DUPLICATE_REFEREE_IN_MATCH");

  return ids;
}

export async function listRefereePlanForTournament(tournamentId: string): Promise<RefereePlanMatch[]> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true },
  });
  if (!tournament) throw new Error("TOURNAMENT_NOT_FOUND");

  const matches = await prisma.match.findMany({
    where: { tournamentId },
    orderBy: { scheduledAt: "asc" },
    select: {
      id: true,
      scheduledAt: true,
      court: true,
      teamAId: true,
      teamBId: true,
      refereeAssignments: {
        select: {
          role: true,
          refereeId: true,
        },
      },
    },
  });

  return matches.map((m) => {
    const refereeAssignments: Partial<Record<RefereeRole, string>> = {};
    for (const a of m.refereeAssignments) {
      refereeAssignments[a.role] = a.refereeId;
    }

    return {
      matchId: m.id,
      scheduledAt: m.scheduledAt.toISOString(),
      court: m.court ?? undefined,
      teamAId: m.teamAId,
      teamBId: m.teamBId,
      refereeAssignments,
    };
  });
}

export async function createRefereePlanMatchForTournament(
  tournamentId: string,
  input: UpsertRefereePlanMatchDto
): Promise<string> {
  const [teamAId, teamBId] = [input.teamAId, input.teamBId];
  if (!teamAId || !teamBId) throw new Error("TEAM_NOT_IN_TOURNAMENT");
  if (teamAId === teamBId) throw new Error("TEAMS_MUST_BE_DIFFERENT");

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true },
  });
  if (!tournament) throw new Error("TOURNAMENT_NOT_FOUND");

  const teams = await prisma.tournamentTeam.findMany({
    where: { tournamentId, teamId: { in: [teamAId, teamBId] } },
    select: { teamId: true },
  });
  if (teams.length !== 2) throw new Error("TEAM_NOT_IN_TOURNAMENT");

  const refereeIds = dedupeAndValidateRefereesPerMatch(input);
  await validateTournamentAndRoles(tournamentId, refereeIds);

  const matchId = await prisma.$transaction(async (tx) => {
    const match = await tx.match.create({
      data: {
        tournamentId,
        scheduledAt: new Date(input.scheduledAt),
        court: input.court?.trim() ? input.court.trim() : null,
        jerseyInfo: null,
        scoreA: null,
        scoreB: null,
        teamAId,
        teamBId,
      },
      select: { id: true },
    });

    const assignments: { matchId: string; role: RefereeRole; refereeId: string }[] = [];
    (Object.keys(roleToDtoKey) as RefereeRole[]).forEach((role) => {
      const refereeId = pickRefereeIdForRole(input, role);
      if (!refereeId) return;
      assignments.push({ matchId: match.id, role, refereeId });
    });

    if (assignments.length > 0) {
      // @@unique([matchId, role]) + @@unique([matchId, refereeId]) are enforced by Prisma/DB.
      await tx.refereeAssignment.createMany({ data: assignments });
    }

    return match.id;
  });

  return matchId;
}

export async function updateRefereePlanMatchForTournament(
  tournamentId: string,
  matchId: string,
  input: UpsertRefereePlanMatchDto
): Promise<string> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { id: true, tournamentId: true },
  });
  if (!match || match.tournamentId !== tournamentId) throw new Error("MATCH_NOT_FOUND");

  const [teamAId, teamBId] = [input.teamAId, input.teamBId];
  if (teamAId === teamBId) throw new Error("TEAMS_MUST_BE_DIFFERENT");

  const teams = await prisma.tournamentTeam.findMany({
    where: { tournamentId, teamId: { in: [teamAId, teamBId] } },
    select: { teamId: true },
  });
  if (teams.length !== 2) throw new Error("TEAM_NOT_IN_TOURNAMENT");

  const refereeIds = dedupeAndValidateRefereesPerMatch(input);
  await validateTournamentAndRoles(tournamentId, refereeIds);

  await prisma.$transaction(async (tx) => {
    await tx.match.update({
      where: { id: matchId },
      data: {
        scheduledAt: new Date(input.scheduledAt),
        court: input.court?.trim() ? input.court.trim() : null,
        teamAId,
        teamBId,
      },
    });

    await tx.refereeAssignment.deleteMany({ where: { matchId } });

    const assignments: { matchId: string; role: RefereeRole; refereeId: string }[] = [];
    (Object.keys(roleToDtoKey) as RefereeRole[]).forEach((role) => {
      const refereeId = pickRefereeIdForRole(input, role);
      if (!refereeId) return;
      assignments.push({ matchId, role, refereeId });
    });

    if (assignments.length > 0) {
      await tx.refereeAssignment.createMany({ data: assignments });
    }
  });

  return tournamentId;
}
