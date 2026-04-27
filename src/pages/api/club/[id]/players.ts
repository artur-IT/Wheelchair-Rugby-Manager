import type { APIRoute } from "astro";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { ClubPlayerSchema } from "@/lib/clubSchemas";
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

  const players = await prisma.clubPlayer.findMany({
    where: { clubId },
    include: { teams: { include: { team: true } } },
    orderBy: { createdAt: "desc" },
  });
  return json(players);
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
  const parsed = parseWithSchema(ClubPlayerSchema, { ...bodyResult.data, clubId });
  if (!parsed.ok) return parsed.response;

  try {
    const created = await prisma.clubPlayer.create({
      data: parsed.data,
      include: { teams: { include: { team: true } } },
    });
    return json(created, 201);
  } catch (error) {
    const mapped = mapPrismaError(error, {
      P2002: { message: "Numer zawodnika musi być unikalny w klubie", status: 409 },
    });
    if (mapped) return mapped;
    return json({ error: "Nie udało się utworzyć zawodnika" }, 500);
  }
};
