import { prisma } from "@/lib/prisma";

export const clubInclude = {
  teams: { include: { coach: true, players: { include: { player: true } } } },
  players: true,
  coaches: true,
  volunteers: true,
  referees: true,
  staffMembers: true,
} as const;

export const getClubById = async (id: string) => prisma.club.findUnique({ where: { id }, include: clubInclude });

export async function getClubPersonById(kind: "coach" | "volunteer" | "referee" | "staff", id: string) {
  if (kind === "coach") return prisma.clubCoach.findUnique({ where: { id } });
  if (kind === "volunteer") return prisma.clubVolunteer.findUnique({ where: { id } });
  if (kind === "referee") return prisma.clubReferee.findUnique({ where: { id } });
  return prisma.clubStaff.findUnique({ where: { id } });
}
