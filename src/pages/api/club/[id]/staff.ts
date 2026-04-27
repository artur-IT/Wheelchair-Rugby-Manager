import type { APIRoute } from "astro";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { z } from "@/lib/zodPl";
import { ClubStaffPersonSchema } from "@/lib/clubSchemas";
import {
  ensureClubAccess,
  ensureClubExists,
  parseRequestJson,
  parseWithSchema,
  requiredId,
} from "@/lib/clubApiHelpers";

const ClubStaffRoleSchema = z.object({
  role: z.enum(["VOLUNTEER", "REFEREE", "OTHER"]).default("OTHER"),
});

export const GET: APIRoute = async ({ params, request }) => {
  const clubIdResult = requiredId(params.id, "Brak id klubu");
  if (!clubIdResult.ok) return clubIdResult.response;
  const clubId = clubIdResult.data;

  const clubGuard = await ensureClubExists(clubId);
  if (!clubGuard.ok) return clubGuard.response;

  const authz = await ensureClubAccess(request, clubId);
  if (!authz.ok) return authz.response;

  const staff = await prisma.clubStaff.findMany({
    where: { clubId },
    orderBy: { createdAt: "desc" },
  });
  return json(staff);
};

export const POST: APIRoute = async ({ params, request }) => {
  const clubIdResult = requiredId(params.id, "Brak id klubu");
  if (!clubIdResult.ok) return clubIdResult.response;
  const clubId = clubIdResult.data;

  const clubGuard = await ensureClubExists(clubId);
  if (!clubGuard.ok) return clubGuard.response;

  const authz = await ensureClubAccess(request, clubId);
  if (!authz.ok) return authz.response;

  const bodyResult = await parseRequestJson(request);
  if (!bodyResult.ok) return bodyResult.response;

  const personParsed = parseWithSchema(ClubStaffPersonSchema, { ...bodyResult.data, clubId });
  if (!personParsed.ok) return personParsed.response;

  const roleParsed = parseWithSchema(ClubStaffRoleSchema, bodyResult.data);
  if (!roleParsed.ok) return roleParsed.response;

  const created = await prisma.clubStaff.create({
    data: { ...personParsed.data, role: roleParsed.data.role },
  });
  return json(created, 201);
};
