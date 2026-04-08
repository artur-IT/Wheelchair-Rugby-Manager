import type { APIRoute } from "astro";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { z } from "@/lib/zodPl";
import { ClubPersonSchema } from "@/lib/clubSchemas";

const ClubStaffSchema = ClubPersonSchema.extend({
  role: z.enum(["VOLUNTEER", "REFEREE", "OTHER"]).default("OTHER"),
});

export const GET: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) return json({ error: "Brak id personelu" }, 400);

  const staff = await prisma.clubStaff.findUnique({ where: { id } });
  if (!staff) return json({ error: "Nie znaleziono osoby" }, 404);
  return json(staff);
};

export const PUT: APIRoute = async ({ params, request }) => {
  const id = params.id;
  if (!id) return json({ error: "Brak id personelu" }, 400);

  const existing = await prisma.clubStaff.findUnique({ where: { id } });
  if (!existing) return json({ error: "Nie znaleziono osoby" }, 404);

  const body = await request.json().catch(() => null);
  const parsed = ClubStaffSchema.safeParse({ ...body, clubId: existing.clubId });
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  const updated = await prisma.clubStaff.update({ where: { id }, data: parsed.data });
  return json(updated);
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) return json({ error: "Brak id personelu" }, 400);

  const existing = await prisma.clubStaff.findUnique({ where: { id } });
  if (!existing) return json({ error: "Nie znaleziono osoby" }, 404);

  await prisma.clubStaff.delete({ where: { id } });
  return json({ success: true });
};
