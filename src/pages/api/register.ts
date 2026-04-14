import type { APIRoute } from "astro";
import { json } from "@/lib/api";
import { hashPassword } from "@/lib/auth/password";
import { RegisterBodySchema } from "@/lib/auth/schemas";
import { prisma } from "@/lib/prisma";

function isPrismaUniqueError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "P2002";
}

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Nieprawidłowe ciało żądania (oczekiwano JSON)." }, 400);
  }

  const parsed = RegisterBodySchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Walidacja nie powiodła się.", details: parsed.error.flatten() }, 400);
  }

  const { localLogin, password, email, name } = parsed.data;
  const passwordHash = await hashPassword(password);
  const displayName = name && name.length > 0 ? name : localLogin;

  try {
    await prisma.user.create({
      data: {
        name: displayName,
        email,
        passwordHash,
        mustResetPassword: false,
        authProvider: "LOCAL",
        localLogin,
        googleSub: null,
        role: "ADMIN",
      },
    });
  } catch (error) {
    if (isPrismaUniqueError(error)) {
      return json({ error: "Nick lub email jest już zajęty." }, 409);
    }
    return json({ error: "Nie udało się utworzyć konta." }, 500);
  }

  return json({ ok: true }, 201);
};
