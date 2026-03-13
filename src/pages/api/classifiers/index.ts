import type { APIRoute } from "astro";
import { z } from "zod";
import { json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { Prisma } from "generated/prisma/client";

const CreateClassifierSchema = z
  .object({
    firstName: z.string().min(1, "Imię jest wymagane"),
    lastName: z.string().min(1, "Nazwisko jest wymagane"),
    email: z.union([z.string().email("Nieprawidłowy email"), z.literal("")]).optional(),
    phone: z.string().optional(),
    seasonId: z.string().min(1, "SeasonId jest wymagany"),
  })
  .transform((o) => ({
    firstName: o.firstName.trim(),
    lastName: o.lastName.trim(),
    email: (o.email?.trim() || undefined) as string | undefined,
    phone: (o.phone?.trim() || undefined) as string | undefined,
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
        return json({ error: "Invalid seasonId" }, 400);
      }
      if (error.code === "P2002") {
        return json({ error: "Classifier already exists" }, 409);
      }
    }
    console.error("Failed to create classifier:", error);
    return json({ error: "Failed to create classifier" }, 500);
  }
};
