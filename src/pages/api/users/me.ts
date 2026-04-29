import type { APIRoute } from "astro";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSessionPrismaUser } from "@/lib/supertokens/sessionFromRequest";
import { z } from "@/lib/zodPl";
import { requiredFirstNameSchema, requiredLastNameSchema, toTitleCase } from "@/lib/validateInputs";

const UpdateCurrentUserSchema = z.object({
  firstName: requiredFirstNameSchema,
  lastName: requiredLastNameSchema,
});

function splitName(name: string): { firstName: string; lastName: string } {
  const normalized = name.trim().replace(/\s+/g, " ");
  const [firstName, ...rest] = normalized.split(" ");
  const lastName = rest.join(" ");
  return {
    firstName: firstName || "",
    lastName: lastName || "",
  };
}

export const GET: APIRoute = async ({ request }) => {
  const sessionUser = await getSessionPrismaUser(request);
  if (!sessionUser) return json({ error: "Brak aktywnej sesji użytkownika" }, 401);

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.userId },
    select: { name: true, email: true },
  });
  if (!user) return json({ error: "Użytkownik nie istnieje" }, 404);

  const { firstName, lastName } = splitName(user.name);
  return json({ firstName, lastName, email: user.email });
};

export const PUT: APIRoute = async ({ request }) => {
  const sessionUser = await getSessionPrismaUser(request);
  if (!sessionUser) return json({ error: "Brak aktywnej sesji użytkownika" }, 401);

  const body = await request.json().catch(() => null);
  const parsed = UpdateCurrentUserSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  const firstName = toTitleCase(parsed.data.firstName);
  const lastName = toTitleCase(parsed.data.lastName);
  const name = `${firstName} ${lastName}`;

  const updatedUser = await prisma.user.update({
    where: { id: sessionUser.userId },
    data: { name },
    select: { email: true },
  });

  return json({ firstName, lastName, email: updatedUser.email });
};
