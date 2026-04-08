import type { APIRoute } from "astro";
import { Prisma } from "generated/prisma/client";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { ClubTeamSchema } from "@/lib/clubSchemas";

export const GET: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) return json({ error: "Brak id drużyny" }, 400);

  const team = await prisma.clubTeam.findUnique({
    where: { id },
    include: { coach: true, players: { include: { player: true } } },
  });
  if (!team) return json({ error: "Nie znaleziono drużyny" }, 404);
  return json(team);
};

export const PUT: APIRoute = async ({ params, request }) => {
  const id = params.id;
  if (!id) return json({ error: "Brak id drużyny" }, 400);

  const existing = await prisma.clubTeam.findUnique({ where: { id } });
  if (!existing) return json({ error: "Nie znaleziono drużyny" }, 404);

  const body = await request.json().catch(() => null);
  const parsed = ClubTeamSchema.safeParse({ ...body, clubId: existing.clubId });
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  try {
    const { playerIds, ...teamData } = parsed.data;
    const updated = await prisma.$transaction(async (tx) => {
      await tx.clubTeam.update({ where: { id }, data: teamData });
      await tx.clubTeamPlayer.deleteMany({ where: { teamId: id } });
      if (playerIds.length > 0) {
        await tx.clubTeamPlayer.createMany({
          data: playerIds.map((playerId) => ({ teamId: id, playerId })),
          skipDuplicates: true,
        });
      }
      return tx.clubTeam.findUniqueOrThrow({
        where: { id },
        include: { coach: true, players: { include: { player: true } } },
      });
    });
    return json(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") return json({ error: "Drużyna o tej nazwie już istnieje w klubie" }, 409);
      if (error.code === "P2003") return json({ error: "Nieprawidłowy trener lub zawodnik" }, 400);
    }
    return json({ error: "Nie udało się zaktualizować drużyny klubu" }, 500);
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) return json({ error: "Brak id drużyny" }, 400);

  const existing = await prisma.clubTeam.findUnique({ where: { id } });
  if (!existing) return json({ error: "Nie znaleziono drużyny" }, 404);

  try {
    await prisma.clubTeam.delete({ where: { id } });
    return json({ success: true });
  } catch {
    return json({ error: "Nie udało się usunąć drużyny klubu" }, 500);
  }
};
