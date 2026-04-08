import type { APIRoute } from "astro";
import { Prisma } from "generated/prisma/client";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { ClubTeamSchema } from "@/lib/clubSchemas";
import { getClubById } from "@/lib/club";

export const GET: APIRoute = async ({ params }) => {
  const clubId = params.id;
  if (!clubId) return json({ error: "Brak id klubu" }, 400);

  const existingClub = await getClubById(clubId);
  if (!existingClub) return json({ error: "Nie znaleziono klubu" }, 404);

  const teams = await prisma.clubTeam.findMany({
    where: { clubId },
    include: { coach: true, players: { include: { player: true } } },
    orderBy: { createdAt: "desc" },
  });
  return json(teams);
};

export const POST: APIRoute = async ({ params, request }) => {
  const clubId = params.id;
  if (!clubId) return json({ error: "Brak id klubu" }, 400);

  const existingClub = await getClubById(clubId);
  if (!existingClub) return json({ error: "Nie znaleziono klubu" }, 404);

  const body = await request.json().catch(() => null);
  const parsed = ClubTeamSchema.safeParse({ ...body, clubId });
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  try {
    const { playerIds, ...teamData } = parsed.data;
    const created = await prisma.$transaction(async (tx) => {
      const team = await tx.clubTeam.create({ data: teamData });
      if (playerIds.length > 0) {
        await tx.clubTeamPlayer.createMany({
          data: playerIds.map((playerId) => ({ teamId: team.id, playerId })),
          skipDuplicates: true,
        });
      }
      return tx.clubTeam.findUniqueOrThrow({
        where: { id: team.id },
        include: { coach: true, players: { include: { player: true } } },
      });
    });
    return json(created, 201);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") return json({ error: "Drużyna o tej nazwie już istnieje w klubie" }, 409);
      if (error.code === "P2003") return json({ error: "Nieprawidłowy trener lub zawodnik" }, 400);
    }
    return json({ error: "Nie udało się utworzyć drużyny klubu" }, 500);
  }
};
