import type { APIRoute } from "astro";
import { z } from "@/lib/zodPl";
import { prisma } from "@/lib/prisma";
import { json } from "@/lib/api";

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

  const season = await prisma.season.create({ data: parsed.data });
  return json(season, 201);
};
