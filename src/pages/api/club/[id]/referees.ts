import type { APIRoute } from "astro";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { ClubCoachRefereePersonSchema } from "@/lib/clubSchemas";
import { ensureClubAccess, ensureClubExists, parseRequestJson, parseWithSchema, requiredId } from "@/lib/clubApiHelpers";

export const GET: APIRoute = async ({ params, request }) => {
  const clubIdResult = requiredId(params.id, "Brak id klubu");
  if (!clubIdResult.ok) return clubIdResult.response;
  const clubId = clubIdResult.data;

  const clubGuard = await ensureClubExists(clubId);
  if (!clubGuard.ok) return clubGuard.response;

  const authz = await ensureClubAccess(request, clubId);
  if (!authz.ok) return authz.response;

  const referees = await prisma.clubReferee.findMany({
    where: { clubId },
    orderBy: { createdAt: "desc" },
  });
  return json(referees);
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
  const parsed = parseWithSchema(ClubCoachRefereePersonSchema, { ...bodyResult.data, clubId });
  if (!parsed.ok) return parsed.response;

  const created = await prisma.clubReferee.create({ data: parsed.data });
  return json(created, 201);
};
