import type { CreateTeamDto } from "@/types";
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
