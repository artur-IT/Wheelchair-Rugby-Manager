import type { APIRoute } from "astro";
import { Prisma } from "generated/prisma/client";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { ClubUpsertSchema } from "@/lib/clubSchemas";
import { getClubById, clubInclude } from "@/lib/club";

export const GET: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) return json({ error: "Brak id klubu" }, 400);

  const club = await getClubById(id);
  if (!club) return json({ error: "Nie znaleziono klubu" }, 404);
  return json(club);
};

export const PUT: APIRoute = async ({ params, request }) => {
  const id = params.id;
  if (!id) return json({ error: "Brak id klubu" }, 400);

  const existing = await getClubById(id);
  if (!existing) return json({ error: "Nie znaleziono klubu" }, 404);

  const body = await request.json().catch(() => null);
  const parsed = ClubUpsertSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  try {
    const updated = await prisma.club.update({
      where: { id },
      data: parsed.data,
      include: clubInclude,
    });
    return json(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return json({ error: "Klub o tej nazwie już istnieje dla tego użytkownika" }, 409);
    }
    return json({ error: "Nie udało się zaktualizować klubu" }, 500);
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) return json({ error: "Brak id klubu" }, 400);

  const existing = await getClubById(id);
  if (!existing) return json({ error: "Nie znaleziono klubu" }, 404);

  try {
    await prisma.club.delete({ where: { id } });
    return json({ success: true });
  } catch {
    return json({ error: "Nie udało się usunąć klubu" }, 500);
  }
};
