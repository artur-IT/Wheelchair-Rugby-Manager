import { beforeEach, describe, expect, it, vi } from "vitest";

const { mocks } = vi.hoisted(() => {
  const transaction = vi.fn();
  return {
    mocks: {
      transaction,
      findManyExam: vi.fn(),
      createExam: vi.fn(),
    },
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tournament: {
      findUnique: vi.fn().mockResolvedValue({ id: "t1" }),
    },
    player: {
      findFirst: vi.fn().mockResolvedValue({ id: "p1" }),
    },
    $transaction: mocks.transaction,
  },
}));

import { createClassifierPlanEntryForTournament } from "./classifierPlan";

describe("createClassifierPlanEntryForTournament", () => {
  beforeEach(() => {
    mocks.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<string>) => {
      const tx = {
        tournamentClassifier: {
          findFirst: vi.fn().mockResolvedValue({ classifierId: "c1" }),
        },
        classificationExam: {
          findMany: mocks.findManyExam,
          create: mocks.createExam,
        },
      };
      return fn(tx);
    });
    mocks.findManyExam.mockResolvedValue([]);
    mocks.createExam.mockResolvedValue({ id: "new-id" });
    mocks.createExam.mockClear();
  });

  it("always creates a new exam row (multiple slots per player/classifier are allowed)", async () => {
    await createClassifierPlanEntryForTournament("t1", {
      playerId: "p1",
      scheduledAt: "2026-05-10T10:00:00.000Z",
      endsAt: "2026-05-10T10:30:00.000Z",
    });
    await createClassifierPlanEntryForTournament("t1", {
      playerId: "p1",
      scheduledAt: "2026-05-11T10:00:00.000Z",
      endsAt: "2026-05-11T10:30:00.000Z",
    });
    expect(mocks.createExam).toHaveBeenCalledTimes(2);
  });
});
