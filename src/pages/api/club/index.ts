import type { APIRoute } from "astro";
import { Prisma } from "generated/prisma/client";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { ClubUpsertSchema } from "@/lib/clubSchemas";
import { clubInclude } from "@/lib/club";

export const GET: APIRoute = async ({ url }) => {
  const ownerUserId = url.searchParams.get("ownerUserId");
  if (!ownerUserId) return json({ error: "Brak ownerUserId" }, 400);

  const clubs = await prisma.club.findMany({
    where: { ownerUserId },
    include: clubInclude,
    orderBy: { createdAt: "desc" },
  });
  return json(clubs);
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  const parsed = ClubUpsertSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  try {
    const created = await prisma.club.create({
      data: parsed.data,
      include: clubInclude,
    });
    return json(created, 201);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return json({ error: "Klub o tej nazwie już istnieje dla tego użytkownika" }, 409);
    }
    return json({ error: "Nie udało się utworzyć klubu" }, 500);
  }
};
