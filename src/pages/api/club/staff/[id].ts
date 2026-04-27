import type { APIRoute } from "astro";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { z } from "@/lib/zodPl";
import { ClubStaffPersonSchema } from "@/lib/clubSchemas";
import { ensureEntityAccess, parseRequestJson, parseWithSchema, requiredId } from "@/lib/clubApiHelpers";

const ClubStaffRoleSchema = z.object({
  role: z.enum(["VOLUNTEER", "REFEREE", "OTHER"]).default("OTHER"),
});

export const GET: APIRoute = async ({ params, request }) => {
  const idResult = requiredId(params.id, "Brak id personelu");
  if (!idResult.ok) return idResult.response;
  const id = idResult.data;

  const guard = await ensureEntityAccess(
    request,
    await prisma.clubStaff.findUnique({ where: { id } }),
    (item) => item.clubId,
    "Nie znaleziono osoby"
  );
  if (!guard.ok) return guard.response;

  return json(guard.data);
};

export const PUT: APIRoute = async ({ params, request }) => {
  const idResult = requiredId(params.id, "Brak id personelu");
  if (!idResult.ok) return idResult.response;
  const id = idResult.data;

  const guard = await ensureEntityAccess(
    request,
    await prisma.clubStaff.findUnique({ where: { id } }),
    (item) => item.clubId,
    "Nie znaleziono osoby"
  );
  if (!guard.ok) return guard.response;
  const existing = guard.data;

  const bodyResult = await parseRequestJson(request);
  if (!bodyResult.ok) return bodyResult.response;

  const personParsed = parseWithSchema(ClubStaffPersonSchema, { ...bodyResult.data, clubId: existing.clubId });
  if (!personParsed.ok) return personParsed.response;

  const roleParsed = parseWithSchema(ClubStaffRoleSchema, bodyResult.data);
  if (!roleParsed.ok) return roleParsed.response;

  const updated = await prisma.clubStaff.update({
    where: { id },
    data: { ...personParsed.data, role: roleParsed.data.role },
  });
  return json(updated);
};

export const DELETE: APIRoute = async ({ params, request }) => {
  const idResult = requiredId(params.id, "Brak id personelu");
  if (!idResult.ok) return idResult.response;
  const id = idResult.data;

  const guard = await ensureEntityAccess(
    request,
    await prisma.clubStaff.findUnique({ where: { id } }),
    (item) => item.clubId,
    "Nie znaleziono osoby"
  );
  if (!guard.ok) return guard.response;

  await prisma.clubStaff.delete({ where: { id } });
  return json({ success: true });
};
