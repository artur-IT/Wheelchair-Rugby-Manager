import type { CreateCoachDto } from "@/types";
import { prisma } from "@/lib/prisma";

// Creates a new coach in the database
export async function createCoach(data: CreateCoachDto) {
  return prisma.coach.create({ data });
}
