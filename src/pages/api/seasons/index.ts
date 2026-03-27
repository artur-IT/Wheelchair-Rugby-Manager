import type { APIRoute } from "astro";
import { z } from "@/lib/zodPl";
import { prisma } from "@/lib/prisma";
import { json } from "@/lib/api";
import { Prisma } from "generated/prisma/client";

const CreateSeasonSchema = z.object({
  name: z.string().min(1),
  year: z.number().int(),
  description: z.string().optional(),
});

export const GET: APIRoute = async () => {
  const seasons = await prisma.season.findMany({
    orderBy: { createdAt: "desc" },
  });
  return json(seasons);
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  const parsed = CreateSeasonSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  try {
    const season = await prisma.season.create({ data: parsed.data });
    return json(season, 201);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return json({ error: "Sezon dla tego roku już istnieje" }, 409);
      }
    }
    return json({ error: "Nie udało się utworzyć sezonu" }, 500);
  }
};
