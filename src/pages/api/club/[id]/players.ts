import type { APIRoute } from "astro";
import { Prisma } from "generated/prisma/client";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { ClubPlayerSchema } from "@/lib/clubSchemas";
import { getClubById } from "@/lib/club";

export const GET: APIRoute = async ({ params }) => {
  const clubId = params.id;
  if (!clubId) return json({ error: "Brak id klubu" }, 400);

  const club = await getClubById(clubId);
  if (!club) return json({ error: "Nie znaleziono klubu" }, 404);

  const players = await prisma.clubPlayer.findMany({
    where: { clubId },
    include: { teams: { include: { team: true } } },
    orderBy: { createdAt: "desc" },
  });
  return json(players);
};

export const POST: APIRoute = async ({ params, request }) => {
  const clubId = params.id;
  if (!clubId) return json({ error: "Brak id klubu" }, 400);

  const club = await getClubById(clubId);
  if (!club) return json({ error: "Nie znaleziono klubu" }, 404);

  const body = await request.json().catch(() => null);
  const parsed = ClubPlayerSchema.safeParse({ ...body, clubId });
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  try {
    const created = await prisma.clubPlayer.create({
      data: parsed.data,
      include: { teams: { include: { team: true } } },
    });
    return json(created, 201);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return json({ error: "Numer zawodnika musi być unikalny w klubie" }, 409);
    }
    return json({ error: "Nie udało się utworzyć zawodnika" }, 500);
  }
};
