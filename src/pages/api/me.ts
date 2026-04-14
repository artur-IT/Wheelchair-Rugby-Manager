import type { APIRoute } from "astro";
import { json } from "@/lib/api";
import { getRequesterIdentity } from "@/lib/clubAuth";
import { prisma } from "@/lib/prisma";
import { z } from "@/lib/zodPl";

export const prerender = false;

const UpdateCurrentUserSchema = z.object({
  name: z.string().trim().min(1).max(60),
  passwordResetEmail: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase())
    .optional(),
});

export const GET: APIRoute = async ({ cookies }) => {
  const auth = await getRequesterIdentity(cookies);
  if ("response" in auth) {
    return auth.response;
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.identity.userId },
    select: {
      id: true,
      name: true,
      email: true,
      passwordResetEmail: true,
      localLogin: true,
      authProvider: true,
    },
  });

  if (!user) {
    return json({ error: "Nie znaleziono użytkownika." }, 404);
  }

  return json({ user });
};

export const PATCH: APIRoute = async ({ cookies, request }) => {
  const auth = await getRequesterIdentity(cookies);
  if ("response" in auth) {
    return auth.response;
  }

  let rawBody;
  try {
    rawBody = await request.json();
  } catch {
    return json({ error: "Nieprawidłowy format JSON." }, 400);
  }
  const parsed = UpdateCurrentUserSchema.safeParse(rawBody);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return json(
      {
        error: "Nieprawidłowe dane.",
        fieldErrors,
      },
      400
    );
  }

  const { name, passwordResetEmail } = parsed.data;

  const user = await prisma.user.update({
    where: { id: auth.identity.userId },
    data: { name, passwordResetEmail: passwordResetEmail ?? null },
    select: {
      id: true,
      name: true,
      email: true,
      passwordResetEmail: true,
      localLogin: true,
      authProvider: true,
    },
  });

  return json({ user });
};
