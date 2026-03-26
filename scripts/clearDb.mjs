/* eslint-env node */

import { createPrismaClient } from "./prismaClient.mjs";

const { console, process } = globalThis;

const prisma = createPrismaClient();

async function clearDb() {
  // Delete leaf/bridge tables first to avoid FK violations.
  await prisma.$transaction([
    prisma.tournamentReferee.deleteMany(),
    prisma.tournamentClassifier.deleteMany(),
    prisma.tournamentPlayer.deleteMany(),
    prisma.tournamentStaff.deleteMany(),
    prisma.tournamentTeam.deleteMany(),

    prisma.refereeAssignment.deleteMany(),
    prisma.match.deleteMany(),
    prisma.classificationExam.deleteMany(),

    prisma.volunteer.deleteMany(),
    prisma.accommodation.deleteMany(),
    prisma.sportsHall.deleteMany(),
    prisma.tournament.deleteMany(),

    prisma.staff.deleteMany(),
    prisma.player.deleteMany(),
    prisma.team.deleteMany(),

    prisma.coach.deleteMany(),
    prisma.referee.deleteMany(),
    prisma.classifier.deleteMany(),

    prisma.season.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

try {
  await clearDb();
  console.log("✅ Database cleared (data only).");
} catch (err) {
  console.error("❌ Failed to clear database:", err);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
