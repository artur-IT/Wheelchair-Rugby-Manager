import type { APIRoute } from "astro";
import { Prisma } from "generated/prisma/client";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { ClubPlayerSchema } from "@/lib/clubSchemas";

export const GET: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) return json({ error: "Brak id zawodnika" }, 400);

  const player = await prisma.clubPlayer.findUnique({
    where: { id },
    include: { teams: { include: { team: true } } },
  });
  if (!player) return json({ error: "Nie znaleziono zawodnika" }, 404);
  return json(player);
};

export const PUT: APIRoute = async ({ params, request }) => {
  const id = params.id;
  if (!id) return json({ error: "Brak id zawodnika" }, 400);

  const existing = await prisma.clubPlayer.findUnique({ where: { id } });
  if (!existing) return json({ error: "Nie znaleziono zawodnika" }, 404);

  const body = await request.json().catch(() => null);
  const parsed = ClubPlayerSchema.safeParse({ ...body, clubId: existing.clubId });
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  try {
    const updated = await prisma.clubPlayer.update({
      where: { id },
      data: parsed.data,
      include: { teams: { include: { team: true } } },
    });
    return json(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return json({ error: "Numer zawodnika musi być unikalny w klubie" }, 409);
    }
    return json({ error: "Nie udało się zaktualizować zawodnika" }, 500);
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) return json({ error: "Brak id zawodnika" }, 400);

  const existing = await prisma.clubPlayer.findUnique({ where: { id } });
  if (!existing) return json({ error: "Nie znaleziono zawodnika" }, 404);

  try {
    await prisma.clubPlayer.delete({ where: { id } });
    return json({ success: true });
  } catch {
    return json({ error: "Nie udało się usunąć zawodnika" }, 500);
  }
};
