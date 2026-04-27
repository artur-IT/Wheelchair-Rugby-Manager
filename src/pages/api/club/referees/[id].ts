import type { APIRoute } from "astro";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { ClubCoachRefereePersonSchema } from "@/lib/clubSchemas";
import { ensureEntityAccess, parseRequestJson, parseWithSchema, requiredId } from "@/lib/clubApiHelpers";

export const GET: APIRoute = async ({ params, request }) => {
  const idResult = requiredId(params.id, "Brak id sędziego");
  if (!idResult.ok) return idResult.response;
  const id = idResult.data;

  const guard = await ensureEntityAccess(
    request,
    await prisma.clubReferee.findUnique({ where: { id } }),
    (item) => item.clubId,
    "Nie znaleziono sędziego"
  );
  if (!guard.ok) return guard.response;

  return json(guard.data);
};

export const PUT: APIRoute = async ({ params, request }) => {
  const id = params.id;
  if (!id) return json({ error: "Brak id sędziego" }, 400);

  const guard = await ensureEntityAccess(
    request,
    await prisma.clubReferee.findUnique({ where: { id } }),
    (item) => item.clubId,
    "Nie znaleziono sędziego"
  );
  if (!guard.ok) return guard.response;
  const existing = guard.data;

  const bodyResult = await parseRequestJson(request);
  if (!bodyResult.ok) return bodyResult.response;
  const parsed = parseWithSchema(ClubCoachRefereePersonSchema, { ...bodyResult.data, clubId: existing.clubId });
  if (!parsed.ok) return parsed.response;

  const updated = await prisma.clubReferee.update({ where: { id }, data: parsed.data });
  return json(updated);
};

export const DELETE: APIRoute = async ({ params, request }) => {
  const idResult = requiredId(params.id, "Brak id sędziego");
  if (!idResult.ok) return idResult.response;
  const id = idResult.data;

  const guard = await ensureEntityAccess(
    request,
    await prisma.clubReferee.findUnique({ where: { id } }),
    (item) => item.clubId,
    "Nie znaleziono sędziego"
  );
  if (!guard.ok) return guard.response;

  await prisma.clubReferee.delete({ where: { id } });
  return json({ success: true });
};
