import type { APIRoute } from "astro";
import { z } from "zod";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  email: z.string().trim().email(),
});

export const GET: APIRoute = async ({ url }) => {
  const parsed = querySchema.safeParse({
    email: url.searchParams.get("email") ?? "",
  });
  if (!parsed.success) {
    return json({ error: "Nieprawidlowy adres e-mail." }, 400);
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
    },
    select: { id: true },
  });

  if (!existing) {
    return json({ conflict: false });
  }

  return json({
    conflict: true,
    message: "Konto z tym adresem e-mail już istnieje.",
  });
};
