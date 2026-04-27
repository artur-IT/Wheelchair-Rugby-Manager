import type { APIRoute } from "astro";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { ClubUpsertSchema } from "@/lib/clubSchemas";
import { clubInclude } from "@/lib/club";
import { mapPrismaError, parseRequestJson, parseWithSchema } from "@/lib/clubApiHelpers";
import { getSessionPrismaUser } from "@/lib/supertokens/sessionFromRequest";

export const GET: APIRoute = async ({ request }) => {
  const sessionUser = await getSessionPrismaUser(request);
  if (!sessionUser) return json({ error: "Brak aktywnej sesji użytkownika" }, 401);

  const clubs = await prisma.club.findMany({
    where: { ownerUserId: sessionUser.userId },
    include: clubInclude,
    orderBy: { createdAt: "desc" },
  });
  return json(clubs);
};

export const POST: APIRoute = async ({ request }) => {
  const sessionUser = await getSessionPrismaUser(request);
  if (!sessionUser) return json({ error: "Brak aktywnej sesji użytkownika" }, 401);

  const bodyResult = await parseRequestJson(request);
  if (!bodyResult.ok) return bodyResult.response;

  const parsed = parseWithSchema(ClubUpsertSchema, { ...bodyResult.data, ownerUserId: sessionUser.userId });
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
