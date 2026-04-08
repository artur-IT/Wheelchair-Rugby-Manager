import type { APIRoute } from "astro";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { ClubPersonSchema } from "@/lib/clubSchemas";
import { getClubById } from "@/lib/club";

export const GET: APIRoute = async ({ params }) => {
  const clubId = params.id;
  if (!clubId) return json({ error: "Brak id klubu" }, 400);

  const club = await getClubById(clubId);
  if (!club) return json({ error: "Nie znaleziono klubu" }, 404);

  const volunteers = await prisma.clubVolunteer.findMany({
    where: { clubId },
    orderBy: { createdAt: "desc" },
  });
  return json(volunteers);
};

export const POST: APIRoute = async ({ params, request }) => {
  const clubId = params.id;
  if (!clubId) return json({ error: "Brak id klubu" }, 400);

  const club = await getClubById(clubId);
  if (!club) return json({ error: "Nie znaleziono klubu" }, 404);

  const body = await request.json().catch(() => null);
  const parsed = ClubPersonSchema.safeParse({ ...body, clubId });
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  const created = await prisma.clubVolunteer.create({ data: parsed.data });
  return json(created, 201);
};
