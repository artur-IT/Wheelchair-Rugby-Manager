import type { APIRoute } from "astro";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { ClubPersonSchema } from "@/lib/clubSchemas";

export const GET: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) return json({ error: "Brak id wolontariusza" }, 400);

  const volunteer = await prisma.clubVolunteer.findUnique({ where: { id } });
  if (!volunteer) return json({ error: "Nie znaleziono wolontariusza" }, 404);
  return json(volunteer);
};

export const PUT: APIRoute = async ({ params, request }) => {
  const id = params.id;
  if (!id) return json({ error: "Brak id wolontariusza" }, 400);

  const existing = await prisma.clubVolunteer.findUnique({ where: { id } });
  if (!existing) return json({ error: "Nie znaleziono wolontariusza" }, 404);

  const body = await request.json().catch(() => null);
  const parsed = ClubPersonSchema.safeParse({ ...body, clubId: existing.clubId });
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  const updated = await prisma.clubVolunteer.update({ where: { id }, data: parsed.data });
  return json(updated);
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) return json({ error: "Brak id wolontariusza" }, 400);

  const existing = await prisma.clubVolunteer.findUnique({ where: { id } });
  if (!existing) return json({ error: "Nie znaleziono wolontariusza" }, 404);

  await prisma.clubVolunteer.delete({ where: { id } });
  return json({ success: true });
};
