import type { APIRoute } from "astro";
import { json } from "@/lib/api";
import { CompletePasswordResetBodySchema } from "@/lib/auth/schemas";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";

/** Clears `mustResetPassword` after the user chose a new password while logged in. */
export const POST: APIRoute = async ({ request, cookies }) => {
  if (cookies.get("session")?.value !== "ok") {
    return json({ error: "Brak aktywnej sesji." }, 401);
  }
  const userId = cookies.get("sessionUserId")?.value?.trim();
  if (!userId) {
    return json({ error: "Brak aktywnej sesji." }, 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const parsed = CompletePasswordResetBodySchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Validation failed.", details: parsed.error.flatten() }, 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mustResetPassword: true },
  });
  if (!user?.mustResetPassword) {
    return json({ error: "Password reset is not required for this account." }, 400);
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, mustResetPassword: false },
  });

  return json({ ok: true }, 200);
};
