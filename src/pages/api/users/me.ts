import type { APIRoute } from "astro";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSessionPrismaUser } from "@/lib/supertokens/sessionFromRequest";

export const GET: APIRoute = async ({ request }) => {
  const sessionUser = await getSessionPrismaUser(request);
  if (!sessionUser) return json({ error: "Brak aktywnej sesji użytkownika" }, 401);

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.userId },
    select: { name: true },
  });
  if (!user) return json({ error: "Użytkownik nie istnieje" }, 404);

  return json({ name: user.name });
};
