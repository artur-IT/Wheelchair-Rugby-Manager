import type { APIRoute } from "astro";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { ClubTeamSchema } from "@/lib/clubSchemas";
import {
  ensureClubAccess,
  ensureClubExists,
  mapPrismaError,
  parseRequestJson,
  parseWithSchema,
  requiredId,
} from "@/lib/clubApiHelpers";

export const GET: APIRoute = async ({ params, request }) => {
  const clubIdResult = requiredId(params.id, "Brak id klubu");
  if (!clubIdResult.ok) return clubIdResult.response;
  const clubId = clubIdResult.data;

  const clubGuard = await ensureClubExists(clubId);
  if (!clubGuard.ok) return clubGuard.response;

  const authz = await ensureClubAccess(request, clubId);
  if (!authz.ok) return authz.response;

  const teams = await prisma.clubTeam.findMany({
    where: { clubId },
    include: { coach: true, players: { include: { player: true } } },
    orderBy: { createdAt: "desc" },
  });
  return json(teams);
};

export const POST: APIRoute = async ({ params, request }) => {
  const clubIdResult = requiredId(params.id, "Brak id klubu");
  if (!clubIdResult.ok) return clubIdResult.response;
  const clubId = clubIdResult.data;

  const clubGuard = await ensureClubExists(clubId);
  if (!clubGuard.ok) return clubGuard.response;

  const authz = await ensureClubAccess(request, clubId);
  if (!authz.ok) return authz.response;

  const bodyResult = await parseRequestJson(request);
  if (!bodyResult.ok) return bodyResult.response;
  const parsed = parseWithSchema(ClubTeamSchema, { ...bodyResult.data, clubId });
  if (!parsed.ok) return parsed.response;

  try {
    const { playerIds, ...teamData } = parsed.data;
    const created = await prisma.$transaction(async (tx) => {
      const team = await tx.clubTeam.create({ data: teamData });
      if (playerIds && playerIds.length > 0) {
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
    const mapped = mapPrismaError(error, {
      P2002: { message: "Drużyna o tej nazwie już istnieje w klubie", status: 409 },
      P2003: { message: "Nieprawidłowy trener lub zawodnik", status: 400 },
    });
    if (mapped) return mapped;
    return json({ error: "Nie udało się utworzyć drużyny klubu" }, 500);
  }
};
