import type { APIRoute } from "astro";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { ClubPersonSchema } from "@/lib/clubSchemas";

export const GET: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) return json({ error: "Brak id trenera" }, 400);

  const coach = await prisma.clubCoach.findUnique({ where: { id } });
  if (!coach) return json({ error: "Nie znaleziono trenera" }, 404);
  return json(coach);
};

export const PUT: APIRoute = async ({ params, request }) => {
  const id = params.id;
  if (!id) return json({ error: "Brak id trenera" }, 400);

  const existing = await prisma.clubCoach.findUnique({ where: { id } });
  if (!existing) return json({ error: "Nie znaleziono trenera" }, 404);

  const body = await request.json().catch(() => null);
  const parsed = ClubPersonSchema.safeParse({ ...body, clubId: existing.clubId });
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  const updated = await prisma.clubCoach.update({ where: { id }, data: parsed.data });
  return json(updated);
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) return json({ error: "Brak id trenera" }, 400);

  const existing = await prisma.clubCoach.findUnique({ where: { id } });
  if (!existing) return json({ error: "Nie znaleziono trenera" }, 404);

  await prisma.clubCoach.delete({ where: { id } });
  return json({ success: true });
};
