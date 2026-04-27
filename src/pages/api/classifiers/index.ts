import type { APIRoute } from "astro";
import { z } from "@/lib/zodPl";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { Prisma } from "generated/prisma/client";
import { requiredPhoneSchema, sanitizePhone, toTitleCase } from "@/lib/validateInputs";

const CreateClassifierSchema = z
  .object({
    firstName: z.string().min(1, "Imię jest wymagane"),
    lastName: z.string().min(1, "Nazwisko jest wymagane"),
    email: z.union([z.string().email("Nieprawidłowy adres e-mail"), z.literal(""), z.null()]).optional(),
    phone: z
      .string()
      .transform((v) => sanitizePhone(v))
      .pipe(requiredPhoneSchema),
    seasonId: z.string().min(1, "Id sezonu jest wymagane"),
  })
  .transform((o) => ({
    firstName: toTitleCase(o.firstName),
    lastName: toTitleCase(o.lastName),
    email: (o.email?.trim() || undefined) as string | undefined,
    phone: o.phone,
    seasonId: o.seasonId,
  }));

export const GET: APIRoute = async ({ url }) => {
  const seasonId = url.searchParams.get("seasonId");

  const classifiers = await prisma.classifier.findMany({
    where: seasonId ? { seasonId } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return json(classifiers);
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  const parsed = CreateClassifierSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  try {
    const classifier = await prisma.classifier.create({ data: parsed.data });
    return json(classifier, 201);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return json({ error: "Nieprawidłowy identyfikator sezonu" }, 400);
      }
      if (error.code === "P2002") {
        return json({ error: "Klasyfikator już istnieje (numer telefonu jest zajęty)" }, 409);
      }
    }
    return json({ error: "Nie udało się utworzyć klasyfikatora" }, 500);
  }
};
