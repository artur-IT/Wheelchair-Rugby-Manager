import type { CreateRefereeDto } from "@/types";
import { prisma } from "@/lib/prisma";

// Creates a new referee in the database
export async function createReferee(data: CreateRefereeDto) {
  return prisma.referee.create({ data });
}
