import type { APIRoute } from "astro";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { ClubPersonSchema } from "@/lib/clubSchemas";

export const GET: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) return json({ error: "Brak id sędziego" }, 400);

  const referee = await prisma.clubReferee.findUnique({ where: { id } });
  if (!referee) return json({ error: "Nie znaleziono sędziego" }, 404);
  return json(referee);
};

export const PUT: APIRoute = async ({ params, request }) => {
  const id = params.id;
  if (!id) return json({ error: "Brak id sędziego" }, 400);

  const existing = await prisma.clubReferee.findUnique({ where: { id } });
  if (!existing) return json({ error: "Nie znaleziono sędziego" }, 404);

  const body = await request.json().catch(() => null);
  const parsed = ClubPersonSchema.safeParse({ ...body, clubId: existing.clubId });
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  const updated = await prisma.clubReferee.update({ where: { id }, data: parsed.data });
  return json(updated);
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) return json({ error: "Brak id sędziego" }, 400);

  const existing = await prisma.clubReferee.findUnique({ where: { id } });
  if (!existing) return json({ error: "Nie znaleziono sędziego" }, 404);

  await prisma.clubReferee.delete({ where: { id } });
  return json({ success: true });
};
