import { prisma } from "@/lib/prisma";
import type { ClassifierPlanEntry, UpsertClassifierPlanEntryDto } from "@/types";
import type { Prisma } from "@prisma/client";

function normalizeClassification(value: number | undefined) {
  if (value == null) return null;
  if (!Number.isFinite(value)) throw new Error("INVALID_CLASSIFICATION");
  if (value < 0 || value > 4) throw new Error("INVALID_CLASSIFICATION");
  if (!Number.isInteger(value * 2)) throw new Error("INVALID_CLASSIFICATION");
  return value;
}

function mustBeValidDate(d: Date, code: string) {
  if (Number.isNaN(d.getTime())) throw new Error(code);
}

function ensureStartBeforeEnd(start: Date, end: Date) {
  if (end.getTime() <= start.getTime()) throw new Error("INVALID_ENDS_AT");
}

async function ensureTournamentExists(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true },
  });
  if (!tournament) throw new Error("TOURNAMENT_NOT_FOUND");
}

type DbClient = Prisma.TransactionClient | typeof prisma;

async function getDefaultClassifierId(db: DbClient, tournamentId: string) {
  const classifier = await db.tournamentClassifier.findFirst({
    where: { tournamentId },
    orderBy: { classifierId: "asc" },
    select: { classifierId: true },
  });
  if (!classifier) throw new Error("NO_CLASSIFIER_IN_TOURNAMENT");
  return classifier.classifierId;
}

async function ensurePlayerInTournament(tournamentId: string, playerId: string) {
  const exists = await prisma.player.findFirst({
    where: {
      id: playerId,
      team: {
        tournaments: {
          some: { tournamentId },
        },
      },
    },
    select: { id: true },
  });
  if (!exists) throw new Error("PLAYER_NOT_IN_TOURNAMENT");
}

async function ensureNoTimeConflict(
  db: DbClient,
  args: {
    tournamentId: string;
    scheduledAt: Date;
    endsAt: Date;
    excludeExamId?: string;
  }
) {
  const exams = await db.classificationExam.findMany({
    where: {
      tournamentId: args.tournamentId,
      scheduledAt: { not: null },
      id: args.excludeExamId ? { not: args.excludeExamId } : undefined,
    },
    select: { scheduledAt: true, endsAt: true },
  });

  for (const e of exams) {
    if (!e.scheduledAt) continue;
    const start = e.scheduledAt;
    const end = e.endsAt ?? new Date(start.getTime() + 30 * 60 * 1000);

    // overlap if: start < otherEnd && otherStart < end
    if (args.scheduledAt.getTime() < end.getTime() && start.getTime() < args.endsAt.getTime()) {
      throw new Error("TIME_CONFLICT");
    }
  }
}

export async function listClassifierPlanForTournament(tournamentId: string): Promise<ClassifierPlanEntry[]> {
  await ensureTournamentExists(tournamentId);

  const exams = await prisma.classificationExam.findMany({
    where: {
      tournamentId,
      scheduledAt: { not: null },
    },
    orderBy: { scheduledAt: "asc" },
    select: {
      id: true,
      playerId: true,
      scheduledAt: true,
      endsAt: true,
      result: true,
      observation: true,
    },
  });

  const scheduledExams = exams.filter((exam) => exam.scheduledAt != null);

  return scheduledExams.map((exam) => {
    const start = exam.scheduledAt ?? new Date(0);
    const end = exam.endsAt ?? new Date(start.getTime() + 30 * 60 * 1000);
    return {
      examId: exam.id,
      playerId: exam.playerId,
      scheduledAt: start.toISOString(),
      endsAt: end.toISOString(),
      classification: exam.result ?? undefined,
      observation: exam.observation,
    };
  });
}

export async function createClassifierPlanEntryForTournament(
  tournamentId: string,
  input: UpsertClassifierPlanEntryDto
): Promise<string> {
  await ensureTournamentExists(tournamentId);
  await ensurePlayerInTournament(tournamentId, input.playerId);

  const scheduledAt = new Date(input.scheduledAt);
  mustBeValidDate(scheduledAt, "INVALID_SCHEDULED_AT");
  const endsAt = new Date(input.endsAt);
  mustBeValidDate(endsAt, "INVALID_ENDS_AT");
  ensureStartBeforeEnd(scheduledAt, endsAt);

  return await prisma.$transaction(
    async (tx) => {
      await ensureNoTimeConflict(tx, { tournamentId, scheduledAt, endsAt });
      const classifierId = await getDefaultClassifierId(tx, tournamentId);

      const created = await tx.classificationExam.create({
        data: {
          tournamentId,
          playerId: input.playerId,
          classifierId,
          scheduledAt,
          endsAt,
          result: normalizeClassification(input.classification),
          observation: input.observation ?? false,
        },
        select: { id: true },
      });

      return created.id;
    },
    { isolationLevel: "Serializable" }
  );
}

export async function updateClassifierPlanEntryForTournament(
  tournamentId: string,
  examId: string,
  input: UpsertClassifierPlanEntryDto
): Promise<string> {
  await ensureTournamentExists(tournamentId);
  await ensurePlayerInTournament(tournamentId, input.playerId);

  const existing = await prisma.classificationExam.findUnique({
    where: { id: examId },
    select: { id: true, tournamentId: true },
  });
  if (!existing || existing.tournamentId !== tournamentId) throw new Error("EXAM_NOT_FOUND");

  const scheduledAt = new Date(input.scheduledAt);
  mustBeValidDate(scheduledAt, "INVALID_SCHEDULED_AT");
  const endsAt = new Date(input.endsAt);
  mustBeValidDate(endsAt, "INVALID_ENDS_AT");
  ensureStartBeforeEnd(scheduledAt, endsAt);
  await prisma.$transaction(
    async (tx) => {
      await ensureNoTimeConflict(tx, { tournamentId, scheduledAt, endsAt, excludeExamId: examId });
      await tx.classificationExam.update({
        where: { id: examId },
        data: {
          playerId: input.playerId,
          scheduledAt,
          endsAt,
          result: normalizeClassification(input.classification),
          observation: input.observation ?? false,
        },
      });
    },
    { isolationLevel: "Serializable" }
  );

  return examId;
}

export async function deleteClassifierPlanEntryForTournament(tournamentId: string, examId: string): Promise<string> {
  await ensureTournamentExists(tournamentId);

  const existing = await prisma.classificationExam.findUnique({
    where: { id: examId },
    select: { id: true, tournamentId: true },
  });
  if (!existing || existing.tournamentId !== tournamentId) throw new Error("EXAM_NOT_FOUND");

  await prisma.classificationExam.delete({ where: { id: examId } });
  return examId;
}
