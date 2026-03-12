import type { CreateTeamDto, UpdateTeamDto } from "@/types";
import { prisma } from "@/lib/prisma";

// Creates a new team with optional staff and players in one transaction
export async function createTeam(data: CreateTeamDto) {
  const { staff, players, ...teamData } = data;
  return prisma.$transaction(async (tx) => {
    const team = await tx.team.create({ data: teamData });
    if (staff?.length) {
      await tx.staff.createMany({
        data: staff.map((s) => ({
          firstName: s.firstName.trim(),
          lastName: s.lastName.trim(),
          teamId: team.id,
        })),
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
    // await tx.staff.deleteMany({ where: { teamId: id } }); old good code
    // await tx.player.deleteMany({ where: { teamId: id } });
    if (staff !== undefined) {
      await tx.staff.deleteMany({ where: { teamId: id } });
      if (staff.length) {
        await tx.staff.createMany({
          data: staff.map((s) => ({
            firstName: s.firstName.trim(),
            lastName: s.lastName.trim(),
            teamId: id,
          })),
        });
      }
    }
    if (players !== undefined) {
      await tx.player.deleteMany({ where: { teamId: id } });
      if (players.length) {
        await tx.player.createMany({
          data: players.map((p) => ({
            firstName: p.firstName.trim(),
            lastName: p.lastName.trim(),
            classification: p.classification ?? null,
            number: p.number ?? null,
            teamId: id,
          })),
        });
      }
    }

    return tx.team.findUniqueOrThrow({
      where: { id },
      include: { staff: true, players: true, coach: true, referee: true },
    });
  });
}
