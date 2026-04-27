import type { APIRoute } from "astro";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { ClubPlayerSchema } from "@/lib/clubSchemas";
import {
  ensureEntityAccess,
  mapPrismaError,
  parseRequestJson,
  parseWithSchema,
  requiredId,
} from "@/lib/clubApiHelpers";

export const GET: APIRoute = async ({ params, request }) => {
  const idResult = requiredId(params.id, "Brak id zawodnika");
  if (!idResult.ok) return idResult.response;
  const id = idResult.data;

  const guard = await ensureEntityAccess(
    request,
    await prisma.clubPlayer.findUnique({
      where: { id },
      include: { teams: { include: { team: true } } },
    }),
    (item) => item.clubId,
    "Nie znaleziono zawodnika"
  );
  if (!guard.ok) return guard.response;

  return json(guard.data);
};

export const PUT: APIRoute = async ({ params, request }) => {
  const id = params.id;
  if (!id) return json({ error: "Brak id zawodnika" }, 400);

  const guard = await ensureEntityAccess(
    request,
    await prisma.clubPlayer.findUnique({ where: { id } }),
    (item) => item.clubId,
    "Nie znaleziono zawodnika"
  );
  if (!guard.ok) return guard.response;
  const existing = guard.data;

  const bodyResult = await parseRequestJson(request);
  if (!bodyResult.ok) return bodyResult.response;
  const parsed = parseWithSchema(ClubPlayerSchema, { ...bodyResult.data, clubId: existing.clubId });
  if (!parsed.ok) return parsed.response;

  try {
    const updated = await prisma.clubPlayer.update({
      where: { id },
      data: parsed.data,
      include: { teams: { include: { team: true } } },
    });
    return json(updated);
  } catch (error) {
    const mapped = mapPrismaError(error, {
      P2002: { message: "Numer zawodnika musi być unikalny w klubie", status: 409 },
    });
    if (mapped) return mapped;
    return json({ error: "Nie udało się zaktualizować zawodnika" }, 500);
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  const idResult = requiredId(params.id, "Brak id zawodnika");
  if (!idResult.ok) return idResult.response;
  const id = idResult.data;

  const guard = await ensureEntityAccess(
    request,
    await prisma.clubPlayer.findUnique({ where: { id } }),
    (item) => item.clubId,
    "Nie znaleziono zawodnika"
  );
  if (!guard.ok) return guard.response;

  try {
    await prisma.clubPlayer.delete({ where: { id } });
    return json({ success: true });
  } catch {
    return json({ error: "Nie udało się usunąć zawodnika" }, 500);
  }
};
