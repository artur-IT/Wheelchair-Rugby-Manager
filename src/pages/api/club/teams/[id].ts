import type { APIRoute } from "astro";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { ClubTeamSchema } from "@/lib/clubSchemas";
import {
  ensureEntityAccess,
  mapPrismaError,
  parseRequestJson,
  parseWithSchema,
  requiredId,
} from "@/lib/clubApiHelpers";

export const GET: APIRoute = async ({ params, request }) => {
  const idResult = requiredId(params.id, "Brak id drużyny");
  if (!idResult.ok) return idResult.response;
  const id = idResult.data;

  const guard = await ensureEntityAccess(
    request,
    await prisma.clubTeam.findUnique({
      where: { id },
      include: { coach: true, players: { include: { player: true } } },
    }),
    (item) => item.clubId,
    "Nie znaleziono drużyny"
  );
  if (!guard.ok) return guard.response;

  return json(guard.data);
};

export const PUT: APIRoute = async ({ params, request }) => {
  const id = params.id;
  if (!id) return json({ error: "Brak id drużyny" }, 400);

  const guard = await ensureEntityAccess(
    request,
    await prisma.clubTeam.findUnique({ where: { id } }),
    (item) => item.clubId,
    "Nie znaleziono drużyny"
  );
  if (!guard.ok) return guard.response;
  const existing = guard.data;

  const bodyResult = await parseRequestJson(request);
  if (!bodyResult.ok) return bodyResult.response;
  const parsed = parseWithSchema(ClubTeamSchema, { ...bodyResult.data, clubId: existing.clubId });
  if (!parsed.ok) return parsed.response;

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
    const mapped = mapPrismaError(error, {
      P2002: { message: "Drużyna o tej nazwie już istnieje w klubie", status: 409 },
      P2003: { message: "Nieprawidłowy trener lub zawodnik", status: 400 },
    });
    if (mapped) return mapped;
    return json({ error: "Nie udało się zaktualizować drużyny klubu" }, 500);
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  const idResult = requiredId(params.id, "Brak id drużyny");
  if (!idResult.ok) return idResult.response;
  const id = idResult.data;

  const guard = await ensureEntityAccess(
    request,
    await prisma.clubTeam.findUnique({ where: { id } }),
    (item) => item.clubId,
    "Nie znaleziono drużyny"
  );
  if (!guard.ok) return guard.response;

  try {
    await prisma.clubTeam.delete({ where: { id } });
    return json({ success: true });
  } catch {
    return json({ error: "Nie udało się usunąć drużyny klubu" }, 500);
  }
};
