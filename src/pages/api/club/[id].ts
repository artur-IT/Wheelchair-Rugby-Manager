import type { APIRoute } from "astro";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { ClubUpsertSchema } from "@/lib/clubSchemas";
import { getClubById, clubInclude } from "@/lib/club";
import { ensureClubAccess, mapPrismaError, parseRequestJson, parseWithSchema, requiredId } from "@/lib/clubApiHelpers";

export const GET: APIRoute = async ({ params, cookies }) => {
  const idResult = requiredId(params.id, "Brak id klubu");
  if (!idResult.ok) return idResult.response;
  const id = idResult.data;
  const authz = await ensureClubAccess(cookies, id);
  if (!authz.ok) return authz.response;

  const club = await getClubById(id);
  if (!club) return json({ error: "Nie znaleziono klubu" }, 404);
  return json(club);
};

export const PUT: APIRoute = async ({ params, request, cookies }) => {
  const idResult = requiredId(params.id, "Brak id klubu");
  if (!idResult.ok) return idResult.response;
  const id = idResult.data;
  const authz = await ensureClubAccess(cookies, id);
  if (!authz.ok) return authz.response;

  const existing = await getClubById(id);
  if (!existing) return json({ error: "Nie znaleziono klubu" }, 404);

  const bodyResult = await parseRequestJson(request);
  if (!bodyResult.ok) return bodyResult.response;
  const parsed = parseWithSchema(ClubUpsertSchema, { ...bodyResult.data, ownerUserId: existing.ownerUserId });
  if (!parsed.ok) return parsed.response;

  try {
    const updated = await prisma.club.update({
      where: { id },
      data: parsed.data,
      include: clubInclude,
    });
    return json(updated);
  } catch (error) {
    const mapped = mapPrismaError(error, {
      P2002: { message: "Klub o tej nazwie już istnieje dla tego użytkownika", status: 409 },
    });
    if (mapped) return mapped;
    return json({ error: "Nie udało się zaktualizować klubu" }, 500);
  }
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const idResult = requiredId(params.id, "Brak id klubu");
  if (!idResult.ok) return idResult.response;
  const id = idResult.data;
  const authz = await ensureClubAccess(cookies, id);
  if (!authz.ok) return authz.response;

  const existing = await getClubById(id);
  if (!existing) return json({ error: "Nie znaleziono klubu" }, 404);

  try {
    await prisma.club.delete({ where: { id } });
    return json({ success: true });
  } catch {
    return json({ error: "Nie udało się usunąć klubu" }, 500);
  }
};
