import type { APIRoute } from "astro";
import { json } from "@/lib/api";
import { getRequesterIdentity } from "@/lib/clubAuth";
import { prisma } from "@/lib/prisma";
import { ClubUpsertSchema } from "@/lib/clubSchemas";
import { clubInclude } from "@/lib/club";
import { mapPrismaError, parseRequestJson, parseWithSchema } from "@/lib/clubApiHelpers";

export const GET: APIRoute = async ({ cookies }) => {
  const auth = await getRequesterIdentity(cookies);
  if (!auth.ok) return auth.response;
  const ownerUserId = auth.identity.userId;

  const clubs = await prisma.club.findMany({
    where: { ownerUserId },
    include: clubInclude,
    orderBy: { createdAt: "desc" },
  });
  return json(clubs);
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const auth = await getRequesterIdentity(cookies);
  if (!auth.ok) return auth.response;
  const ownerUserId = auth.identity.userId;

  const bodyResult = await parseRequestJson(request);
  if (!bodyResult.ok) return bodyResult.response;

  const parsed = parseWithSchema(ClubUpsertSchema, { ...bodyResult.data, ownerUserId });
  if (!parsed.ok) return parsed.response;

  try {
    const created = await prisma.club.create({
      data: parsed.data,
      include: clubInclude,
    });
    return json(created, 201);
  } catch (error) {
    const mapped = mapPrismaError(error, {
      P2002: { message: "Klub o tej nazwie już istnieje dla tego użytkownika", status: 409 },
    });
    if (mapped) return mapped;
    return json({ error: "Nie udało się utworzyć klubu" }, 500);
  }
};
