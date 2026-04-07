import type { CreateTeamDto, UpdateTeamDto } from "@/types";
import { prisma } from "@/lib/prisma";

// Creates a new team with optional staff and players in one transaction
export async function createTeam(data: CreateTeamDto) {
  const { staff, players, ...teamData } = data;
  return prisma.$transaction(async (tx) => {
    const team = await tx.team.create({ data: teamData });
    if (staff?.length) {
      const staffIds: string[] = [];
      for (const s of staff) {
        const firstName = s.firstName.trim();
        const lastName = s.lastName.trim();
        const staffMember = await tx.staff.upsert({
          where: { seasonId_firstName_lastName: { seasonId: teamData.seasonId, firstName, lastName } },
          update: {},
          create: { seasonId: teamData.seasonId, firstName, lastName },
        });
        staffIds.push(staffMember.id);
      }
      await tx.team.update({
        where: { id: team.id },
        data: { staff: { connect: staffIds.map((id) => ({ id })) } },
      });
    }
    if (players?.length) {
      await tx.player.createMany({
        data: players.map((p) => ({
          firstName: p.firstName.trim(),
          lastName: p.lastName.trim(),
          classification: p.classification ?? null,
          number: p.number ?? null,
          teamId: team.id,
        })),
      });
    }
    return tx.team.findUniqueOrThrow({
      where: { id: team.id },
      include: { staff: true, players: true },
    });
  });
}

export async function getTeamById(id: string) {
  return prisma.team.findUnique({
    where: { id },
    include: { players: true, staff: true, coach: true, referee: true },
  });
}

/** Update team and replace staff/players with payload. */
export async function updateTeam(id: string, data: UpdateTeamDto) {
  const { staff, players, ...teamData } = data;
  return prisma.$transaction(async (tx) => {
    const existing = await tx.team.findUniqueOrThrow({ where: { id } });
    const payload = {
      ...teamData,
      seasonId: teamData.seasonId ?? existing.seasonId,
    };
    await tx.team.update({ where: { id }, data: payload });
    if (staff !== undefined) {
      await tx.team.update({ where: { id }, data: { staff: { set: [] } } });
      if (staff.length) {
        const staffIds: string[] = [];
        for (const s of staff) {
          const firstName = s.firstName.trim();
          const lastName = s.lastName.trim();
          const staffMember = await tx.staff.upsert({
            where: { seasonId_firstName_lastName: { seasonId: payload.seasonId, firstName, lastName } },
            update: {},
            create: { seasonId: payload.seasonId, firstName, lastName },
          });
          staffIds.push(staffMember.id);
        }
        await tx.team.update({
          where: { id },
          data: { staff: { connect: staffIds.map((staffId) => ({ id: staffId })) } },
        });
      }
    }
    if (players !== undefined) {
      const existingPlayers = await tx.player.findMany({
        where: { teamId: id },
        select: { id: true },
      });
      const existingPlayerIds = new Set(existingPlayers.map((player) => player.id));
      const incomingExistingIds = players
        .map((player) => player.id)
        .filter((playerId): playerId is string => Boolean(playerId && existingPlayerIds.has(playerId)));

      await tx.player.deleteMany({
        where: {
          teamId: id,
          ...(incomingExistingIds.length > 0 ? { id: { notIn: incomingExistingIds } } : {}),
        },
      });

      for (const player of players) {
        const playerData = {
          firstName: player.firstName.trim(),
          lastName: player.lastName.trim(),
          classification: player.classification ?? null,
          number: player.number ?? null,
        };
        if (player.id && existingPlayerIds.has(player.id)) {
          await tx.player.update({
            where: { id: player.id },
            data: playerData,
          });
          continue;
        }
        await tx.player.create({
          data: {
            ...playerData,
            teamId: id,
          },
        });
      }
    }

    return tx.team.findUniqueOrThrow({
      where: { id },
      include: { staff: true, players: true, coach: true, referee: true },
    });
  });
}
