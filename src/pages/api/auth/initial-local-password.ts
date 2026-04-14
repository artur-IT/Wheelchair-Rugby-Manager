import type { APIRoute } from "astro";
import { json } from "@/lib/api";
import { InitialLocalPasswordBodySchema } from "@/lib/auth/schemas";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";

/** Sets the first password for migrated LOCAL users (no hash, flag set). Unauthenticated. */
export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const parsed = InitialLocalPasswordBodySchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Validation failed.", details: parsed.error.flatten() }, 400);
  }

  const { localLogin, password } = parsed.data;

  const user = await prisma.user.findFirst({
    where: {
      authProvider: "LOCAL",
      localLogin,
      passwordHash: null,
      mustResetPassword: true,
    },
    select: { id: true },
  });

  if (!user) {
    const delay = () => new Promise((r) => setTimeout(r, 400));
    await delay();
    return json({ error: "Unable to set password for this account." }, 404);
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, mustResetPassword: false },
  });

  return json({ ok: true }, 200);
};
